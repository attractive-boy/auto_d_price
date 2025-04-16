const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 确保目标目录存在
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('创建dist目录成功');
}

// 安装pkg依赖（如果尚未安装）
console.log('正在检查pkg依赖...');
exec('npm list -g pkg || npm install -g pkg', (error, stdout, stderr) => {
  if (error) {
    console.error(`安装pkg出错: ${error.message}`);
    return;
  }
  
  console.log('正在打包应用...');
  // 使用pkg打包应用
  exec('pkg . --targets node18-win-x64 --output dist/auto_d_price.exe', (error, stdout, stderr) => {
    if (error) {
      console.error(`打包出错: ${error.message}`);
      return;
    }
    
    console.log('应用打包完成！');
    console.log('输出文件: dist/auto_d_price.exe');
    
    // 复制必要的文件到dist目录
    console.log('正在复制必要文件...');
    
    // 复制storage目录
    const storageDir = path.join(__dirname, 'storage');
    const distStorageDir = path.join(distDir, 'storage');
    if (!fs.existsSync(distStorageDir)) {
      fs.mkdirSync(distStorageDir, { recursive: true });
    }
    
    // 复制state.json文件（如果存在）
    const stateFilePath = path.join(storageDir, 'state.json');
    const distStateFilePath = path.join(distStorageDir, 'state.json');
    if (fs.existsSync(stateFilePath)) {
      fs.copyFileSync(stateFilePath, distStateFilePath);
    } else {
      fs.writeFileSync(distStateFilePath, '{}', 'utf8');
    }
    
    console.log('创建README文件...');
    // 创建README文件
    const readmePath = path.join(distDir, 'README.txt');
    const readmeContent = `自动化浏览器工具使用说明
====================

1. 双击运行auto_d_price.exe启动应用
   首次运行时会自动安装所需的浏览器组件

2. 应用会自动打开浏览器并导航到目标网页

3. 浏览器状态会自动保存在storage目录中

4. 如需关闭应用，请按Ctrl+C或关闭命令行窗口
`;
    
    fs.writeFileSync(readmePath, readmeContent, 'utf8');
    
    console.log('所有操作完成！');
  });
});