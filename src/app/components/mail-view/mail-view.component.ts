import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { MailService } from '../../services/mail.service';
import { MailAccount, Email } from '../../models/account.model';
import { ComposeEmailDialogComponent } from '../compose-email-dialog/compose-email-dialog.component';

@Component({
  selector: 'app-mail-view',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    DragDropModule,
    FormsModule
  ],
  template: `
    <div class="mail-container">
      <div class="sidebar">
        <div class="account-selector">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>アカウント</mat-label>
            <mat-select [(ngModel)]="selectedAccountId" (selectionChange)="onAccountChange()">
              <mat-option *ngFor="let account of accounts" [value]="account.id">
                {{ account.name }} ({{ account.email }})
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="folder-list" *ngIf="selectedAccountId" cdkDropList (cdkDropListDropped)="dropFolder($event)">
          <div class="folder-item" 
               cdkDrag
               *ngFor="let folder of sortedFolders; let i = index" 
               [class.active]="selectedFolder === folder">
            <div class="folder-drag-handle" cdkDragHandle>
              <mat-icon class="drag-icon">drag_handle</mat-icon>
            </div>
            <button mat-button class="folder-button" (click)="selectFolder(folder)">
              <mat-icon>folder</mat-icon>
              {{ folder }}
            </button>
            <div class="cdk-drag-preview" *cdkDragPlaceholder></div>
          </div>
        </div>
      </div>

      <div class="main-content">
        <div class="mail-list-panel" [style.width.px]="mailListWidth">
          <div class="mail-list-header">
            <button mat-raised-button color="primary" (click)="composeEmail()" class="compose-button">
              <mat-icon>edit</mat-icon>
              作成
            </button>
            <button mat-icon-button (click)="refreshEmails()" [disabled]="loading">
              <mat-icon>refresh</mat-icon>
            </button>
            <span class="mail-count">{{ filteredEmails.length }} / {{ emails.length }} 件</span>
          </div>

          <div class="mail-filter">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>検索</mat-label>
              <input matInput 
                     [(ngModel)]="filterText" 
                     (ngModelChange)="applyFilter()"
                     placeholder="件名、送信者で検索">
              <mat-icon matPrefix>search</mat-icon>
              <button mat-icon-button 
                      matSuffix 
                      *ngIf="filterText" 
                      (click)="clearFilter()"
                      aria-label="クリア">
                <mat-icon>clear</mat-icon>
              </button>
            </mat-form-field>
          </div>
          
          <div class="mail-list" *ngIf="!loading">
            <div class="mail-item" 
                 *ngFor="let email of filteredEmails" 
                 [class.selected]="selectedEmail?.uid === email.uid"
                 (click)="selectEmail(email)">
              <div class="mail-item-header">
                <div class="mail-from">{{ getDisplayName(email.from) }}</div>
                <div class="mail-date">{{ formatDate(email.date) }}</div>
              </div>
              <div class="mail-subject">{{ email.subject }}</div>
            </div>
          </div>

          <div class="loading-spinner" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <div class="empty-state" *ngIf="!loading && emails.length === 0 && selectedAccountId">
            <p>メールがありません</p>
          </div>

          <div class="empty-state" *ngIf="!loading && emails.length > 0 && filteredEmails.length === 0">
            <p>検索条件に一致するメールがありません</p>
          </div>

          <div class="empty-state" *ngIf="!selectedAccountId">
            <p>アカウントを選択してください</p>
          </div>
          <div class="resize-handle" 
               (mousedown)="startResize($event)"
               title="ドラッグして幅を調整">
          </div>
        </div>

        <div class="mail-content-panel">
          <div *ngIf="selectedEmail" class="email-content">
            <div class="email-header">
              <div class="email-header-top">
                <h2 class="email-subject">{{ selectedEmail.subject }}</h2>
                <button mat-raised-button color="warn" (click)="deleteSelectedEmail()" class="delete-button">
                  <mat-icon>delete</mat-icon>
                  削除
                </button>
              </div>
              <div class="email-meta">
                <div class="meta-item">
                  <mat-icon class="meta-icon">person</mat-icon>
                  <span class="meta-label">送信者:</span>
                  <span class="meta-value">{{ getDisplayName(selectedEmail.from) }}</span>
                </div>
                <div class="meta-item">
                  <mat-icon class="meta-icon">schedule</mat-icon>
                  <span class="meta-label">日時:</span>
                  <span class="meta-value">{{ formatDate(selectedEmail.date) }}</span>
                </div>
              </div>
            </div>
            <div class="email-body-wrapper">
              <div class="email-body" [innerHTML]="sanitizedEmailContent"></div>
            </div>
          </div>
          <div *ngIf="!selectedEmail" class="no-email-selected">
            <p>メールを選択してください</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mail-container {
      display: flex;
      height: calc(100vh - 64px);
    }

    .sidebar {
      width: 250px;
      background: #f5f5f5;
      border-right: 1px solid #ddd;
      padding: 16px;
      overflow-y: auto;
    }

    .account-selector {
      margin-bottom: 20px;
    }

    .full-width {
      width: 100%;
    }

    .folder-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .folder-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .folder-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 4px 8px;
      border-radius: 4px;
      margin-bottom: 4px;
      cursor: move;
      transition: background 0.2s;
    }

    .folder-item:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .folder-item.active {
      background: #e3f2fd;
    }

    .folder-item.active .folder-button {
      color: #1976d2;
    }

    .folder-item.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .folder-list.cdk-drop-list-dragging .folder-item:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .folder-drag-handle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      margin-right: 8px;
      cursor: grab;
      color: #999;
    }

    .folder-drag-handle:active {
      cursor: grabbing;
    }

    .drag-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .folder-button {
      flex: 1;
      text-align: left;
      justify-content: flex-start;
      padding: 8px;
    }

    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                  0 8px 10px 1px rgba(0, 0, 0, 0.14),
                  0 3px 14px 2px rgba(0, 0, 0, 0.12);
      background: white;
      opacity: 0.9;
    }

    .cdk-drag-placeholder {
      opacity: 0.3;
      background: #ccc;
      border-radius: 4px;
    }

    .main-content {
      display: flex;
      flex: 1;
    }

    .mail-list-panel {
      min-width: 300px;
      max-width: 800px;
      width: 400px;
      border-right: 1px solid #ddd;
      display: flex;
      flex-direction: column;
      position: relative;
      flex-shrink: 0;
    }

    .mail-list-header {
      padding: 16px;
      border-bottom: 1px solid #ddd;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .mail-filter {
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      background: #fff;
    }

    .filter-field {
      width: 100%;
      font-size: 14px;
    }

    .compose-button {
      margin-right: auto;
    }

    .mail-count {
      font-size: 14px;
      color: #666;
    }

    .mail-list {
      flex: 1;
      overflow-y: auto;
    }

    .mail-item {
      padding: 16px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background 0.2s;
    }

    .mail-item:hover {
      background: #f5f5f5;
    }

    .mail-item.selected {
      background: #e3f2fd;
    }

    .mail-item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .mail-from {
      font-weight: 500;
      font-size: 14px;
    }

    .mail-date {
      font-size: 12px;
      color: #666;
    }

    .mail-subject {
      font-size: 14px;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .mail-content-panel {
      flex: 1;
      padding: 0;
      overflow-y: auto;
      overflow-x: hidden;
      background: #fafafa;
    }

    .email-content {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .email-header {
      border-bottom: 1px solid #e0e0e0;
      padding: 20px 24px;
      background: #fff;
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      flex-shrink: 0;
    }

    .email-header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      gap: 16px;
    }

    .email-subject {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      line-height: 1.4;
      color: rgba(0, 0, 0, 0.87);
      flex: 1;
      word-break: break-word;
    }

    .delete-button {
      flex-shrink: 0;
    }

    .email-meta {
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-size: 14px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: rgba(0, 0, 0, 0.6);
    }

    .meta-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(0, 0, 0, 0.54);
    }

    .meta-label {
      font-weight: 500;
      min-width: 60px;
    }

    .meta-value {
      color: rgba(0, 0, 0, 0.87);
      word-break: break-all;
    }

    .email-body-wrapper {
      padding: 32px 40px;
      background: #fff;
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .email-body {
      line-height: 1.6;
      color: #333;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
    }

    .email-body ::ng-deep * {
      box-sizing: border-box;
    }

    .email-body ::ng-deep p {
      margin: 0 0 12px 0;
      line-height: 1.6;
    }

    .email-body ::ng-deep p:last-child {
      margin-bottom: 0;
    }

    /* メール本文の元のスタイルを尊重 */
    .email-body ::ng-deep div,
    .email-body ::ng-deep span,
    .email-body ::ng-deep table,
    .email-body ::ng-deep td,
    .email-body ::ng-deep th {
      max-width: 100% !important;
    }

    .email-body ::ng-deep img {
      max-width: 100% !important;
      height: auto !important;
      border-radius: 0;
      margin: 12px 0;
      display: block;
      object-fit: contain;
    }

    .email-body ::ng-deep a {
      color: #1976d2;
      text-decoration: none;
    }

    .email-body ::ng-deep a:hover {
      text-decoration: underline;
    }

    .email-body ::ng-deep blockquote {
      border-left: 4px solid #e0e0e0;
      padding-left: 16px;
      margin: 16px 0;
      color: rgba(0, 0, 0, 0.6);
      font-style: italic;
    }

    .email-body ::ng-deep pre {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
    }

    .email-body ::ng-deep code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }

    .email-body ::ng-deep table {
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: collapse;
      margin: 16px 0;
      table-layout: auto;
    }

    .email-body ::ng-deep table td,
    .email-body ::ng-deep table th {
      padding: 8px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .email-body ::ng-deep ul,
    .email-body ::ng-deep ol {
      margin: 12px 0;
      padding-left: 24px;
    }

    .email-body ::ng-deep li {
      margin: 6px 0;
      line-height: 1.6;
    }

    .email-body ::ng-deep h1,
    .email-body ::ng-deep h2,
    .email-body ::ng-deep h3,
    .email-body ::ng-deep h4,
    .email-body ::ng-deep h5,
    .email-body ::ng-deep h6 {
      margin: 16px 0 8px 0;
      font-weight: 600;
      line-height: 1.4;
    }

    .email-body ::ng-deep h1 {
      font-size: 22px;
    }

    .email-body ::ng-deep h2 {
      font-size: 18px;
    }

    .email-body ::ng-deep h3 {
      font-size: 16px;
    }

    .email-body ::ng-deep hr {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 20px 0;
    }

    .email-body ::ng-deep strong,
    .email-body ::ng-deep b {
      font-weight: 600;
    }

    .email-body ::ng-deep em,
    .email-body ::ng-deep i {
      font-style: italic;
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 1;
    }

    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 1;
      color: #999;
    }

    .no-email-selected {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #999;
    }

    .resize-handle {
      position: absolute;
      right: -8px;
      top: 0;
      bottom: 0;
      width: 16px;
      cursor: col-resize;
      z-index: 1000;
      background: transparent;
      transition: background 0.2s;
      user-select: none;
      -webkit-user-select: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .resize-handle:hover {
      background: rgba(25, 118, 210, 0.1);
    }

    .resize-handle::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 10%;
      bottom: 10%;
      width: 4px;
      background: #ddd;
      transform: translateX(-50%);
      border-radius: 2px;
      transition: all 0.2s;
    }

    .resize-handle:hover::before {
      background: #1976d2;
      width: 5px;
    }
  `]
})
export class MailViewComponent implements OnInit {
  accounts: MailAccount[] = [];
  selectedAccountId: string | null = null;
  folders: string[] = [];
  sortedFolders: string[] = [];
  selectedFolder: string = 'INBOX';
  emails: Email[] = [];
  filteredEmails: Email[] = [];
  selectedEmail: Email | null = null;
  loading: boolean = false;
  mailListWidth: number = 400;
  isResizing: boolean = false;
  filterText: string = '';

  constructor(
    private accountService: AccountService,
    private mailService: MailService,
    private dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.loadAccounts();
  }

  async loadAccounts() {
    this.accounts = await this.accountService.getAccounts();
    if (this.accounts.length > 0 && !this.selectedAccountId) {
      this.selectedAccountId = this.accounts[0].id || null;
      await this.onAccountChange();
    }
  }

  async onAccountChange() {
    if (this.selectedAccountId) {
      await this.loadFolders();
      await this.loadEmails();
    }
  }

  async loadFolders() {
    if (!this.selectedAccountId) return;
    
    try {
      this.folders = await this.mailService.getFolders(this.selectedAccountId);
      this.applyFolderOrder();
      if (this.sortedFolders.length > 0 && !this.sortedFolders.includes(this.selectedFolder)) {
        this.selectedFolder = this.sortedFolders[0];
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      this.folders = ['INBOX'];
      this.sortedFolders = ['INBOX'];
    }
  }

  applyFolderOrder() {
    const account = this.accounts.find(a => a.id === this.selectedAccountId);
    if (account && account.folderOrder && account.folderOrder.length > 0) {
      // 保存された順序を適用
      const ordered: string[] = [];
      const unordered: string[] = [];
      
      // 保存された順序に従って追加
      account.folderOrder.forEach(folder => {
        if (this.folders.includes(folder)) {
          ordered.push(folder);
        }
      });
      
      // 順序が保存されていないフォルダーを追加
      this.folders.forEach(folder => {
        if (!ordered.includes(folder)) {
          unordered.push(folder);
        }
      });
      
      this.sortedFolders = [...ordered, ...unordered];
    } else {
      // 順序が保存されていない場合は元の順序を使用
      this.sortedFolders = [...this.folders];
    }
  }

  dropFolder(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.sortedFolders, event.previousIndex, event.currentIndex);
    this.saveFolderOrder();
  }

  async saveFolderOrder() {
    if (!this.selectedAccountId) return;
    
    const account = this.accounts.find(a => a.id === this.selectedAccountId);
    if (account) {
      account.folderOrder = [...this.sortedFolders];
      await this.accountService.saveAccount(account);
      // アカウントリストを更新
      await this.loadAccounts();
    }
  }

  async selectFolder(folder: string) {
    this.selectedFolder = folder;
    await this.loadEmails();
  }

  async loadEmails() {
    if (!this.selectedAccountId) return;

    this.loading = true;
    try {
      this.emails = await this.mailService.fetchEmails(this.selectedAccountId, this.selectedFolder);
      // フィルターを適用
      this.applyFilter();
      // 選択されたメールが現在のフォルダーにない場合は選択を解除
      if (this.selectedEmail && !this.filteredEmails.find(e => e.uid === this.selectedEmail?.uid)) {
        this.selectedEmail = null;
      } else if (!this.selectedEmail) {
        this.selectedEmail = null;
      }
    } catch (error) {
      console.error('Error loading emails:', error);
      alert('メールの取得に失敗しました: ' + (error as Error).message);
      this.emails = [];
      this.filteredEmails = [];
    } finally {
      this.loading = false;
    }
  }

  applyFilter() {
    if (!this.filterText || this.filterText.trim() === '') {
      this.filteredEmails = [...this.emails];
      return;
    }

    const searchText = this.filterText.toLowerCase().trim();
    this.filteredEmails = this.emails.filter(email => {
      const subject = (email.subject || '').toLowerCase();
      const from = this.getDisplayName(email.from).toLowerCase();
      const fromOriginal = (email.from || '').toLowerCase();
      
      return subject.includes(searchText) || 
             from.includes(searchText) || 
             fromOriginal.includes(searchText);
    });
  }

  clearFilter() {
    this.filterText = '';
    this.applyFilter();
  }

  async refreshEmails() {
    await this.loadEmails();
  }

  selectEmail(email: Email) {
    this.selectedEmail = email;
    // メールコンテンツを更新
    this.updateSanitizedContent();
  }

  get sanitizedEmailContent(): string {
    if (!this.selectedEmail) {
      return '';
    }
    return this.getEmailContent(this.selectedEmail);
  }

  updateSanitizedContent() {
    // このメソッドは、メールが選択されたときに呼び出される
    // 必要に応じて、ここで追加の処理を行う
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP');
  }

  getDisplayName(from: string): string {
    if (!from) {
      return '';
    }

    // "Name" <email@example.com> の形式をパース
    // ダブルクオートで囲まれた名前を抽出
    const quotedNameMatch = from.match(/^"([^"]+)"\s*<[^>]+>$/);
    if (quotedNameMatch && quotedNameMatch[1]) {
      return quotedNameMatch[1];
    }

    // Name <email@example.com> の形式をパース（ダブルクオートなし）
    const nameEmailMatch = from.match(/^([^<]+)\s*<[^>]+>$/);
    if (nameEmailMatch && nameEmailMatch[1]) {
      return nameEmailMatch[1].trim();
    }

    // <email@example.com> の形式の場合、メールアドレスのみ
    const emailOnlyMatch = from.match(/^<([^>]+)>$/);
    if (emailOnlyMatch && emailOnlyMatch[1]) {
      return emailOnlyMatch[1];
    }

    // メールアドレスのみの場合（< >がない場合）
    if (from.includes('@') && !from.includes('<')) {
      return from;
    }

    // その他の形式の場合、< >で囲まれた部分を削除
    let displayName = from.replace(/<[^>]+>/g, '').trim();
    // ダブルクオートを削除
    displayName = displayName.replace(/^"|"$/g, '');
    
    return displayName || from;
  }

  getEmailContent(email: Email): string {
    // HTMLが存在する場合はHTMLを優先、なければテキストを使用
    let content = email.html || email.body || '';
    
    if (!content) {
      return '';
    }

    // HTMLコンテンツが完全なHTMLドキュメントを含んでいる場合、<body>タグの内容だけを抽出
    if (email.html) {
      // まず、<!DOCTYPE>やコメントを削除
      content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
      content = content.replace(/<!--[\s\S]*?-->/g, '');
      
      // <body>タグの内容を抽出（最初の<body>タグのみ）
      // ネストされた<body>タグを処理するため、最初の<body>から最初の</body>までを抽出
      let bodyStart = content.indexOf('<body');
      if (bodyStart !== -1) {
        // <body>タグの開始位置を見つける
        bodyStart = content.indexOf('>', bodyStart) + 1;
        // 最初の</body>タグの位置を見つける（ネストされた<body>タグを考慮）
        let bodyEnd = content.indexOf('</body>', bodyStart);
        if (bodyEnd !== -1) {
          // 抽出したコンテンツ内にさらに<body>タグがないか確認
          let extracted = content.substring(bodyStart, bodyEnd);
          // ネストされた<body>タグを削除
          extracted = extracted.replace(/<body[^>]*>/gi, '');
          extracted = extracted.replace(/<\/body>/gi, '');
          content = extracted.trim();
        } else {
          // </body>タグがない場合、<body>タグ以降のすべてを使用
          content = content.substring(bodyStart).trim();
          // ネストされた<body>タグを削除
          content = content.replace(/<body[^>]*>/gi, '');
          content = content.replace(/<\/body>/gi, '');
        }
      } else if (content.includes('<html')) {
        // <html>タグが含まれているが<body>タグがない場合、<html>タグと<head>タグを削除
        // <head>タグとその内容を削除
        content = content.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
        // <html>タグと</html>タグを削除
        content = content.replace(/<\/?html[^>]*>/gi, '');
        content = content.trim();
      }
      
      // デバッグ: メールコンテンツの長さと<body>タグの数を確認
      const bodyTagCount = (content.match(/<body[^>]*>/gi) || []).length;
      if (bodyTagCount > 0) {
        console.warn('Warning: Found', bodyTagCount, 'body tags in email content');
      }
    }

    return content;
  }

  composeEmail() {
    const dialogRef = this.dialog.open(ComposeEmailDialogComponent, {
      width: '700px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Optionally refresh emails after sending
        // this.refreshEmails();
      }
    });
  }

  startResize(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    this.isResizing = true;
    const startX = event.pageX;
    const startWidth = this.mailListWidth;

    const doResize = (e: MouseEvent) => {
      if (!this.isResizing) return;
      
      const diff = e.pageX - startX;
      const newWidth = startWidth + diff;
      // 最小幅300px、最大幅800px
      this.mailListWidth = Math.max(300, Math.min(800, newWidth));
    };

    const stopResize = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', doResize);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
    };

    document.addEventListener('mousemove', doResize, { passive: false });
    document.addEventListener('mouseup', stopResize, { passive: true });
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'auto';
  }

  async deleteSelectedEmail() {
    if (!this.selectedEmail || !this.selectedAccountId) {
      return;
    }

    if (!confirm('このメールを削除しますか？')) {
      return;
    }

    try {
      console.log('Deleting email:', {
        accountId: this.selectedAccountId,
        folder: this.selectedFolder,
        uid: this.selectedEmail.uid
      });

      const success = await this.mailService.deleteEmail(
        this.selectedAccountId,
        this.selectedFolder,
        this.selectedEmail.uid
      );

      if (success) {
        // Remove email from list
        this.emails = this.emails.filter(e => e.uid !== this.selectedEmail?.uid);
        this.selectedEmail = null;
        // Refresh to get updated list
        await this.loadEmails();
      } else {
        alert('メールの削除に失敗しました。');
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert('メールの削除中にエラーが発生しました: ' + errorMessage);
    }
  }
}

