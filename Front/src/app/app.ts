import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FavoritesService } from './services/favorites.service';
import { Store } from '@ngxs/store';
import { CheckAuth, Logout } from './store/auth.state';
import { AuthState } from './store/auth.state';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  isLoggedIn$: Observable<boolean>;
  user$: Observable<any>;
  favoritesCount = 0;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private favoritesService: FavoritesService,
    private store: Store
  ) {
    this.isLoggedIn$ = this.store.select(AuthState.isAuthenticated);
    this.user$ = this.store.select(AuthState.user);
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.store.dispatch(new CheckAuth());
    }

    this.favoritesService.favorites$.subscribe(favorites => {
      this.favoritesCount = favorites.length;
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  onLogin(): void {
    this.router.navigate(['/login']);
  }

  onLogout(): void {
    this.store.dispatch(new Logout());
    this.favoritesService.clearCurrentUser();
    this.router.navigate(['/']);
  }

  onUserList(): void {
    this.router.navigate(['/users']);
  }

  onFavorites(): void {
    this.router.navigate(['/favorites']);
  }
}
