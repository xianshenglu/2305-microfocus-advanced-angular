import { Component, effect } from '@angular/core';
import { Observable, Subject, distinctUntilChanged, map, merge, switchAll, tap } from 'rxjs';
import { Color } from './models/color.model';
import { ColorsService } from './services/colors.service';
import { signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  search$ = new Subject<string>();
  results$!: Observable<Color[]>;
  isBusy$!: Observable<boolean>;

  search = signal("")
  results = signal<Color[]>([])
  isBusy = signal(false);

  isSignalMode = true;

  constructor(private colorsService: ColorsService) {
    const res$ = this.search$.pipe(
      map(keyword => this.colorsService.search(keyword)),
      switchAll()
      )

    this.results$ = res$;


    const true$ = this.search$.pipe(
      map(_ => true)
    );

    const false$ = this.results$.pipe(
      map(_ => false)
    );

    this.isBusy$ = merge(true$, false$).pipe(
      distinctUntilChanged()
    );
    this.watchSearchSignal();
    // this.watchSearchSignalObservable();

  }

  private watchSearchSignal() {
    effect(async () => {
      this.isBusy.set(true);
      const keyword = this.search();
      const results = await this.colorsService.search(keyword);
      const isSearchedKeywordSameAsCurrent = keyword === this.search();
      if (isSearchedKeywordSameAsCurrent) { // just a replacement for switchAll operator
        this.isBusy.set(false);
        this.results.set(results);
      }
    }, { allowSignalWrites: true });
  }
  private watchSearchSignalObservable() {
    toObservable(this.search).pipe(
      tap(() => this.isBusy.set(true)),
      map(keyword => this.colorsService.search(keyword)),
      switchAll(),
      tap((results) => {
        this.isBusy.set(false);
        this.results.set(results);
      }),
      takeUntilDestroyed()
    ).subscribe();
  }
  // log<T>(observable: Observable<T>, prefix: string) {
  //   observable.subscribe({
  //     next: val => console.log(`${prefix} next ${val}`),
  //     complete: () => console.log(`${prefix} complete`),
  //     error: err => console.log(`${prefix} error ${err}`),
  //   })
  // }


  // go() {
  //   const input$ = interval(1000);
  //   this.log(input$, 'input');

  //   const take$ = input$.pipe(
  //     take(3)
  //   )
  //   this.log(take$, 'take');

  // }
}
