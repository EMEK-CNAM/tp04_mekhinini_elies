import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PollutionService } from '../services/pollution.service';
import { Pollution } from '../models/pollution';

@Component({
    selector: 'app-pollution-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './pollution-form.html',
    styleUrls: ['./pollution-form.css']
})
export class PollutionForm implements OnInit {
    pollutionForm!: FormGroup;
    isEditMode = false;
    pollutionId?: string;
    errorMessage: string | null = null;
    successMessage: string | null = null;
    selectedFile: File | null = null;
    previewUrl: string | null = null;
    uploadProgress: number = 0;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private svc: PollutionService,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        this.pollutionForm = this.fb.group({
            titre: ['', Validators.required],
            lieu: ['', Validators.required],
            date_observation: ['', Validators.required],
            type_pollution: ['', Validators.required],
            description: [''],
            latitude: [0, Validators.required],
            longitude: [0, Validators.required],
            photo_url: ['']
        });
    }

    ngOnInit(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.pollutionId = id;
            this.svc.getById(id).subscribe({
                next: (pollution) => {
                    this.pollutionForm.patchValue(pollution);
                    if (pollution.photo_url) {
                        this.previewUrl = pollution.photo_url;
                    }
                },
                error: (err) => console.error('Erreur chargement:', err)
            });
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            // Vérification du type de fichier
            if (!file.type.startsWith('image/')) {
                this.errorMessage = 'Veuillez sélectionner une image';
                return;
            }

            // Vérification de la taille (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.errorMessage = 'L\'image ne doit pas dépasser 5MB';
                return;
            }

            this.selectedFile = file;
            this.errorMessage = null;

            // Créer un aperçu
            const reader = new FileReader();
            reader.onload = () => {
                this.previewUrl = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage(): void {
        this.selectedFile = null;
        this.previewUrl = null;
        this.pollutionForm.patchValue({ photo_url: '' });
    }

    private async uploadImage(): Promise<string | null> {
        if (!this.selectedFile) return null;

        // Simuler un upload - Dans un vrai projet, vous feriez un appel API
        // Pour l'instant, on convertit en base64
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result as string);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(this.selectedFile!);
        });
    }

    async onSubmit(): Promise<void> {
        if (this.pollutionForm.invalid) {
            this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
            return;
        }

        this.errorMessage = null;
        this.successMessage = null;

        // Upload de l'image si une nouvelle image est sélectionnée
        if (this.selectedFile) {
            this.uploadProgress = 0;
            const photoUrl = await this.uploadImage();
            if (photoUrl) {
                this.pollutionForm.patchValue({ photo_url: photoUrl });
            }
            this.uploadProgress = 100;
        }

        const pollution: Pollution = this.pollutionForm.value;

        console.log('Données du formulaire:', pollution);

        if (this.isEditMode && this.pollutionId) {
            this.svc.update(this.pollutionId, pollution).subscribe({
                next: (response) => {
                    console.log('Mise à jour réussie:', response);
                    this.successMessage = 'Pollution mise à jour avec succès';
                    setTimeout(() => this.router.navigate(['/pollutions', this.pollutionId]), 1000);
                },
                error: (err) => {
                    console.error('Erreur mise à jour complète:', err);
                    this.errorMessage = 'Erreur lors de la mise à jour: ' + (err.error?.message || err.message || 'Erreur inconnue');
                }
            });
        } else {
            console.log('Création de pollution avec payload:', pollution);
            this.svc.create(pollution).subscribe({
                next: (response) => {
                    console.log('Création réussie:', response);
                    this.successMessage = 'Pollution créée avec succès';
                    setTimeout(() => this.router.navigate(['/pollutions']), 1000);
                },
                error: (err) => {
                    console.error('Erreur création complète:', err);
                    this.errorMessage = 'Erreur lors de la création: ' + (err.error?.message || err.message || 'Erreur inconnue');
                }
            });
        }
    }

    onCancel(): void {
        if (this.isEditMode && this.pollutionId) {
            this.router.navigate(['/pollutions', this.pollutionId]);
        } else {
            this.router.navigate(['/pollutions']);
        }
    }
}
