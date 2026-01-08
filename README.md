# Twitter Markdown Viewer

X (Twitter) のツイートに含まれる Markdown 記法を自動的にレンダリングして表示する Chrome 拡張機能です。

## 機能

- コードブロック (```)
- インラインコード (`)
- 見出し (#, ##, ###)
- リスト (-, *, 1.)
- 引用 (>)
- 太字 (**)、斜体 (*)
- リンク ([text](url))
- 取り消し線 (~~)

## インストール方法

### 1. リポジトリをクローン

```bash
git clone https://github.com/ttlg/twitter-markdown-viewer.git
```

### 2. Chrome に拡張機能を追加

1. Chrome で `chrome://extensions` を開く
2. 右上の「デベロッパーモード」をONにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. クローンしたフォルダを選択

### 3. 動作確認

X (Twitter) を開くと、Markdown 記法を含むツイートが自動的にレンダリングされます。

## 使い方

- Markdown を含むツイートは自動的にレンダリングされます
- ツイートのアクションバーに表示される「MD」ボタンで、レンダリング表示と元のテキストを切り替えられます

## 更新方法

```bash
cd twitter-markdown-viewer
git pull
```

その後、`chrome://extensions` で拡張機能の更新ボタン (↻) をクリックしてください。
