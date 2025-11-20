import { Component, Inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AccountService } from '../../services/account.service';
import { MailAccount } from '../../models/account.model';

@Component({
  selector: 'app-account-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'アカウント編集' : 'アカウント追加' }}</h2>
    <mat-dialog-content>
      <form #accountForm="ngForm" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>アカウント名</mat-label>
          <input matInput [(ngModel)]="account.name" name="name" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>メールアドレス</mat-label>
          <input matInput type="email" [(ngModel)]="account.email" name="email" required>
        </mat-form-field>

        <h3>IMAP設定</h3>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>IMAP ホスト</mat-label>
          <input matInput [(ngModel)]="account.imap.host" name="imapHost" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>IMAP ポート</mat-label>
          <input matInput type="number" [(ngModel)]="account.imap.port" name="imapPort" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>IMAP ユーザー名</mat-label>
          <input matInput [(ngModel)]="account.imap.username" name="imapUsername" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>IMAP パスワード</mat-label>
          <input matInput type="password" [(ngModel)]="account.imap.password" name="imapPassword" required>
        </mat-form-field>

        <mat-checkbox [(ngModel)]="account.imap.tls" name="imapTls">TLSを使用</mat-checkbox>

        <h3>SMTP設定</h3>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>SMTP ホスト</mat-label>
          <input matInput [(ngModel)]="account.smtp.host" name="smtpHost" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>SMTP ポート</mat-label>
          <input matInput type="number" [(ngModel)]="account.smtp.port" name="smtpPort" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>SMTP ユーザー名</mat-label>
          <input matInput [(ngModel)]="account.smtp.username" name="smtpUsername" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>SMTP パスワード</mat-label>
          <input matInput type="password" [(ngModel)]="account.smtp.password" name="smtpPassword" required>
        </mat-form-field>

        <mat-checkbox [(ngModel)]="account.smtp.tls" name="smtpTls">TLSを使用</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">キャンセル</button>
      <button mat-raised-button color="primary" type="button" (click)="save()" [disabled]="!accountForm?.valid">保存</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 10px;
    }
    
    h3 {
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 16px;
      font-weight: 500;
    }
    
    mat-checkbox {
      margin-bottom: 10px;
    }
  `]
})
export class AccountEditDialogComponent {
  @ViewChild('accountForm') accountForm!: NgForm;
  account: MailAccount;

  constructor(
    public dialogRef: MatDialogRef<AccountEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MailAccount | null,
    private accountService: AccountService
  ) {
    if (data) {
      this.account = { ...data };
    } else {
      this.account = {
        name: '',
        email: '',
        imap: {
          host: '',
          port: 993,
          username: '',
          password: '',
          tls: true
        },
        smtp: {
          host: '',
          port: 465,
          username: '',
          password: '',
          tls: true
        }
      };
    }
  }

  async save() {
    if (!this.accountForm || !this.accountForm.valid) {
      alert('すべての必須項目を入力してください。');
      return;
    }

    try {
      const success = await this.accountService.saveAccount(this.account);
      if (success) {
        this.dialogRef.close(true);
      } else {
        alert('アカウントの保存に失敗しました。');
      }
    } catch (error) {
      console.error('Error saving account:', error);
      alert('アカウントの保存中にエラーが発生しました。');
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }
}

