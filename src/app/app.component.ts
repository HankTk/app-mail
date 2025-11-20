import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button routerLink="/mail" class="home-button">
        <mat-icon>home</mat-icon>
      </button>
      <span class="app-title" routerLink="/mail">App Mail</span>
      <span class="spacer"></span>
      <button mat-icon-button routerLink="/settings" routerLinkActive="active">
        <mat-icon>settings</mat-icon>
      </button>
    </mat-toolbar>
    <router-outlet></router-outlet>
  `,
  styles: [`
    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .app-title {
      cursor: pointer;
      margin-left: 8px;
      user-select: none;
    }
    .app-title:hover {
      opacity: 0.8;
    }
    .home-button {
      margin-right: 8px;
    }
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    router-outlet {
      flex: 1;
      overflow: hidden;
    }
  `]
})
export class AppComponent {
  title = 'app-mail';
}

