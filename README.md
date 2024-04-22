# avail-airdrop-check
批量检查Avail节点冲突以及轻节点挑战的空投奖励

## 安装依赖
```bash
npm install
```

## 导入助记词
1. 新增 `mnemonics.txt` 文件
2. 将 Avail 账户的助记词写入到  `mnemonics.txt` 文件，要求每行一个助记词

## 运行程序
```bash
npx ts-node index.ts
```