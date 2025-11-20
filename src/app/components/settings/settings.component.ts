import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AccountService } from '../../services/account.service';
import { MailAccount } from '../../models/account.model';
import { AccountEditDialogComponent } from '../account-edit-dialog/account-edit-dialog.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDialogModule
  ],
  template: `
    <div class="settings-container">
      <mat-card>
        <mat-card-header>
          <div class="header-content">
            <button mat-icon-button (click)="goBack()" class="back-button">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <mat-card-title>メールアカウント設定</mat-card-title>
            <span class="spacer"></span>
            <button mat-raised-button color="primary" (click)="addAccount()" class="add-button-header">
              <mat-icon>add</mat-icon>
              アカウントを追加
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="accounts-table-container" *ngIf="accounts.length > 0">
            <table class="accounts-table">
              <thead>
                <tr>
                  <th>アカウント名</th>
                  <th>メールアドレス</th>
                  <th>IMAP</th>
                  <th>SMTP</th>
                  <th class="actions-column">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let account of accounts">
                  <td class="account-name-cell">{{ account.name }}</td>
                  <td class="account-email-cell">{{ account.email }}</td>
                  <td class="server-info-cell">{{ account.imap.host }}:{{ account.imap.port }}</td>
                  <td class="server-info-cell">{{ account.smtp.host }}:{{ account.smtp.port }}</td>
                  <td class="actions-cell">
                    <button mat-icon-button (click)="editAccount(account)" title="編集">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="deleteAccount(account.id!)" title="削除">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div *ngIf="accounts.length === 0" class="empty-state">
            <mat-icon class="empty-icon">mail_outline</mat-icon>
            <p>アカウントが登録されていません</p>
            <button mat-raised-button color="primary" (click)="addAccount()" class="add-button-empty">
              <mat-icon>add</mat-icon>
              アカウントを追加
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      min-height: calc(100vh - 64px);
      display: flex;
      flex-direction: column;
    }
    
    mat-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-top: 0;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      width: 100%;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .back-button {
      margin-right: 8px;
    }
    
    mat-card-header {
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0;
    }
    
    .add-button-header {
      margin-left: auto;
    }
    
    mat-card-content {
      padding: 0 !important;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .accounts-table-container {
      overflow-x: auto;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }
    
    .accounts-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    
    .accounts-table thead {
      background-color: #f5f5f5;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .accounts-table th {
      padding: 16px;
      text-align: left;
      font-weight: 500;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
      border-bottom: 2px solid #e0e0e0;
    }
    
    .accounts-table th:nth-child(1) {
      width: 15%;
    }
    
    .accounts-table th:nth-child(2) {
      width: 25%;
    }
    
    .accounts-table th:nth-child(3) {
      width: 20%;
    }
    
    .accounts-table th:nth-child(4) {
      width: 20%;
    }
    
    .accounts-table th:nth-child(5) {
      width: 10%;
    }
    
    .accounts-table td {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .accounts-table tbody tr {
      transition: background-color 0.2s;
    }
    
    .accounts-table tbody tr:hover {
      background-color: #f9f9f9;
    }
    
    .account-name-cell {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }
    
    .account-email-cell {
      color: rgba(0, 0, 0, 0.6);
    }
    
    .server-info-cell {
      color: rgba(0, 0, 0, 0.6);
      font-size: 12px;
      font-family: monospace;
    }
    
    .actions-column {
      width: 120px;
      text-align: center;
    }
    
    .actions-cell {
      text-align: center;
      white-space: nowrap;
    }
    
    .actions-cell button {
      margin: 0 4px;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 40px;
      color: #999;
    }
    
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }
    
    .empty-state p {
      font-size: 16px;
      margin-bottom: 24px;
    }
    
    .add-button-empty {
      margin-top: 8px;
    }
  `]
})
export class SettingsComponent implements OnInit {
  accounts: MailAccount[] = [];

  constructor(
    private accountService: AccountService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadAccounts();
  }

  async loadAccounts() {
    this.accounts = await this.accountService.getAccounts();
  }

  addAccount() {
    const dialogRef = this.dialog.open(AccountEditDialogComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.loadAccounts();
      }
    });
  }

  editAccount(account: MailAccount) {
    const dialogRef = this.dialog.open(AccountEditDialogComponent, {
      width: '600px',
      data: { ...account }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.loadAccounts();
      }
    });
  }

  async deleteAccount(accountId: string) {
    if (confirm('このアカウントを削除しますか？')) {
      await this.accountService.deleteAccount(accountId);
      await this.loadAccounts();
    }
  }

  goBack() {
    this.router.navigate(['/mail']);
  }
}

