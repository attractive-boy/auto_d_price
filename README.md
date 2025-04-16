# 自动化浏览器工具

这是一个使用Playwright进行浏览器自动化的项目，可以自动打开浏览器并导航到目标网页，同时保存浏览器状态。

## 安装与使用

### 前置条件

- 安装Node.js (推荐v18或更高版本)
- 安装npm包管理器

### 安装依赖

```bash
npm install
```

### 安装浏览器驱动

首次使用前，需要安装Playwright浏览器驱动：

```bash
npm run install-browsers
# 或者直接使用
npx playwright install
```

### 运行应用

```bash
npm start
```

应用会自动打开浏览器并导航到目标网页，浏览器状态会保存在`storage/state.json`文件中。

## 打包成可执行文件

本项目支持打包成独立的Windows可执行文件(.exe)：

```bash
npm run build
```

打包完成后，可执行文件将生成在`dist`目录中：
- `dist/auto_d_price.exe` - 主程序
- `dist/storage/` - 存储目录
- `dist/README.txt` - 使用说明

## 注意事项

1. 打包后的可执行文件仍然需要安装Playwright浏览器驱动才能正常运行
2. 如需关闭应用，请按Ctrl+C或关闭命令行窗口
3. 浏览器状态会自动保存在storage目录中，便于下次使用