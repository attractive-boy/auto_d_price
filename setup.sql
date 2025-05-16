-- 创建数据库
CREATE DATABASE IF NOT EXISTS auto_price_db;
USE auto_price_db;

-- 创建程序访问控制表
CREATE TABLE IF NOT EXISTS program_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    expiry_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入初始数据
INSERT INTO program_access (program_id, is_active, expiry_date)
VALUES ('auto_price', TRUE, '2025-12-31 23:59:59')
ON DUPLICATE KEY UPDATE
    is_active = VALUES(is_active),
    expiry_date = VALUES(expiry_date); 