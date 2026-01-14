import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap } from 'rxjs/operators';
import { PollutionService } from '../services/pollution.service';
import { Pollution } from '../models/pollution';

// Actions
export class LoadPollutions {
    static readonly type = '[Pollution] Load Pollutions';
}

export class LoadPollution {
    static readonly type = '[Pollution] Load Pollution';
    constructor(public id: string | number) { }
}

export class CreatePollution {
    static readonly type = '[Pollution] Create Pollution';
    constructor(public pollution: Pollution) { }
}

export class UpdatePollution {
    static readonly type = '[Pollution] Update Pollution';
    constructor(public id: string | number, public pollution: Pollution) { }
}

export class DeletePollution {
    static readonly type = '[Pollution] Delete Pollution';
    constructor(public id: string | number) { }
}

export class SearchPollutions {
    static readonly type = '[Pollution] Search Pollutions';
    constructor(public searchTerm: string) { }
}

export class FilterByType {
    static readonly type = '[Pollution] Filter By Type';
    constructor(public type: string) { }
}

// State Model
export interface PollutionStateModel {
    pollutions: Pollution[];
    selectedPollution: Pollution | null;
    loading: boolean;
    searchTerm: string;
    filterType: string;
}

@State<PollutionStateModel>({
    name: 'pollution',
    defaults: {
        pollutions: [],
        selectedPollution: null,
        loading: false,
        searchTerm: '',
        filterType: ''
    }
})
@Injectable()
export class PollutionState {
    constructor(private pollutionService: PollutionService) { }

    @Selector()
    static pollutions(state: PollutionStateModel): Pollution[] {
        let results = state.pollutions;

        // Filtrage par recherche
        if (state.searchTerm) {
            const term = state.searchTerm.toLowerCase();
            results = results.filter(p =>
                p.titre.toLowerCase().includes(term) ||
                p.lieu.toLowerCase().includes(term) ||
                p.description.toLowerCase().includes(term)
            );
        }

        // Filtrage par type
        if (state.filterType && state.filterType !== 'all') {
            results = results.filter(p => p.type_pollution === state.filterType);
        }

        return results;
    }

    @Selector()
    static selectedPollution(state: PollutionStateModel): Pollution | null {
        return state.selectedPollution;
    }

    @Selector()
    static loading(state: PollutionStateModel): boolean {
        return state.loading;
    }

    @Selector()
    static searchTerm(state: PollutionStateModel): string {
        return state.searchTerm;
    }

    @Selector()
    static filterType(state: PollutionStateModel): string {
        return state.filterType;
    }

    @Action(LoadPollutions)
    loadPollutions(ctx: StateContext<PollutionStateModel>) {
        ctx.patchState({ loading: true });
        return this.pollutionService.getAll().pipe(
            tap((pollutions) => {
                ctx.patchState({
                    pollutions: pollutions,
                    loading: false
                });
            })
        );
    }

    @Action(LoadPollution)
    loadPollution(ctx: StateContext<PollutionStateModel>, action: LoadPollution) {
        ctx.patchState({ loading: true });
        return this.pollutionService.getById(action.id).pipe(
            tap((pollution) => {
                ctx.patchState({
                    selectedPollution: pollution,
                    loading: false
                });
            })
        );
    }

    @Action(CreatePollution)
    createPollution(ctx: StateContext<PollutionStateModel>, action: CreatePollution) {
        ctx.patchState({ loading: true });
        return this.pollutionService.create(action.pollution).pipe(
            tap((pollution) => {
                const state = ctx.getState();
                ctx.patchState({
                    pollutions: [...state.pollutions, pollution],
                    loading: false
                });
            })
        );
    }

    @Action(UpdatePollution)
    updatePollution(ctx: StateContext<PollutionStateModel>, action: UpdatePollution) {
        ctx.patchState({ loading: true });
        return this.pollutionService.update(action.id, action.pollution).pipe(
            tap((updatedPollution) => {
                const state = ctx.getState();
                const pollutions = state.pollutions.map(p =>
                    p.id === action.id ? updatedPollution : p
                );
                ctx.patchState({
                    pollutions: pollutions,
                    selectedPollution: updatedPollution,
                    loading: false
                });
            })
        );
    }

    @Action(DeletePollution)
    deletePollution(ctx: StateContext<PollutionStateModel>, action: DeletePollution) {
        ctx.patchState({ loading: true });
        return this.pollutionService.delete(action.id).pipe(
            tap(() => {
                const state = ctx.getState();
                const filteredPollutions = state.pollutions.filter(p => p.id !== action.id);
                ctx.patchState({
                    pollutions: filteredPollutions,
                    loading: false
                });
            })
        );
    }

    @Action(SearchPollutions)
    searchPollutions(ctx: StateContext<PollutionStateModel>, action: SearchPollutions) {
        ctx.patchState({
            searchTerm: action.searchTerm
        });
    }

    @Action(FilterByType)
    filterByType(ctx: StateContext<PollutionStateModel>, action: FilterByType) {
        ctx.patchState({
            filterType: action.type
        });
    }
}
