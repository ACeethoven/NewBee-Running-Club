-- MySQL Schema for AWS RDS (updated for MySQL syntax)
-- Database: newbee_running_club

USE newbee_running_club;

-- Consolidated Donor Table
CREATE TABLE donors (
    donation_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    donor_type ENUM('individual', 'enterprise') NOT NULL,
    donation_event VARCHAR(255) DEFAULT 'General Support',
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Additional fields from original CSV data
    source VARCHAR(255),
    receipt_confirmed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    -- Indexes for better performance
    INDEX idx_donor_type (donor_type),
    INDEX idx_donor_id (donor_id),
    INDEX idx_donation_event (donation_event),
    INDEX idx_amount (amount),
    INDEX idx_created_at (created_at)
);

-- Sample data migration from CSV files
INSERT INTO donors (donor_id, name, donor_type, donation_event, amount, source, receipt_confirmed, notes, created_at) VALUES
-- Individual Donors (from individualDonors.csv)
('IND001', '57P', 'individual', 'General Support', 300.00, 'Zelle (Ciping Wu)', TRUE, '', '2025-04-02 00:00:00'),
('IND002', '嘉宏', 'individual', 'General Support', 200.00, 'Zelle (Jiahong Chen)', TRUE, 'Anonymous Donor', '2025-04-02 00:00:00'),
('IND003', 'Mia You', 'individual', 'General Support', 66.66, 'Zelle (Mengyang You)', TRUE, '', '2025-04-02 00:00:00'),
('IND004', 'NJ', 'individual', 'General Support', 300.00, 'Zelle (Najing Chen)', TRUE, '', '2025-04-02 00:00:00'),
('IND005', 'Shawn Tian', 'individual', 'General Support', 300.00, 'Zelle (Shuo Tian)', TRUE, '', '2025-04-02 00:00:00'),
('IND006', '🈷️', 'individual', 'General Support', 300.00, 'Zelle (Yue Ma)', TRUE, '', '2025-04-02 00:00:00'),
('IND007', '静', 'individual', 'General Support', 500.00, 'Zelle (Jing Pu)', TRUE, '', '2025-04-03 00:00:00'),
('IND008', '佳成', 'individual', 'General Support', 300.00, 'Zelle (Jinying Lu)', TRUE, 'Anonymous Donor', '2025-04-03 00:00:00'),
('IND009', 'Alex', 'individual', 'General Support', 100.00, 'Zelle (Shujun Lu)', TRUE, '', '2025-04-03 00:00:00'),
('IND010', '也子', 'individual', 'General Support', 300.00, 'Zelle (Ye Wang)', TRUE, '', '2025-04-03 00:00:00'),
('IND011', 'Jenny', 'individual', 'General Support', 100.00, 'Zelle (Jingxuan Zhang)', TRUE, '', '2025-04-08 00:00:00'),
('IND012', '幸运小徐', 'individual', 'General Support', 100.00, 'Zelle (Yin Xu)', TRUE, '', '2025-04-09 00:00:00'),
('IND013', '66', 'individual', 'General Support', 500.66, 'Zelle (Xinlei Huang)', TRUE, '', '2025-04-12 00:00:00'),
('IND014', 'Brandon', 'individual', 'General Support', 600.00, 'Zelle (Zhen Shen)', TRUE, '', '2025-04-20 00:00:00'),
('IND015', 'Richie', 'individual', 'General Support', 50.00, 'Zelle (Richie Zhao)', TRUE, '', '2025-04-29 00:00:00'),
('IND016', '688', 'individual', 'General Support', 688.00, 'Zelle (Jingxuan Zhang)', FALSE, '', '2025-05-19 00:00:00'),
('IND017', 'Ceethoven', 'individual', 'General Support', 200.00, 'Zelle (Chengcheng Zhao)', FALSE, '', '2025-05-20 00:00:00'),
('IND018', '胡鑫兰', 'individual', 'BK Half Course Preview', 25.00, 'Zelle (Xinlan Hu)', TRUE, 'BK HALF Course Preview Donation', '2025-05-03 00:00:00'),

-- Enterprise Donors (from enterpriseDonors.csv)
('ENT001', 'Google', 'enterprise', 'Annual Corporate Sponsorship', 50000.00, 'Corporate Transfer', TRUE, 'Title Sponsor', '2024-03-15 00:00:00'),
('ENT002', 'Microsoft', 'enterprise', 'Annual Corporate Sponsorship', 45000.00, 'Corporate Transfer', TRUE, 'Gold Sponsor', '2024-03-14 00:00:00'),
('ENT003', 'Apple', 'enterprise', 'Annual Corporate Sponsorship', 60000.00, 'Corporate Transfer', TRUE, 'Platinum Sponsor', '2024-03-13 00:00:00'),
('ENT004', 'Amazon', 'enterprise', 'Annual Corporate Sponsorship', 55000.00, 'Corporate Transfer', TRUE, 'Gold Sponsor', '2024-03-12 00:00:00'),
('ENT005', 'JP Morgan', 'enterprise', 'Annual Corporate Sponsorship', 40000.00, 'Corporate Transfer', TRUE, 'Silver Sponsor', '2024-03-11 00:00:00'),
('ENT006', 'Goldman Sachs', 'enterprise', 'Annual Corporate Sponsorship', 35000.00, 'Corporate Transfer', TRUE, 'Silver Sponsor', '2024-03-10 00:00:00'),
('ENT007', 'Facebook', 'enterprise', 'Annual Corporate Sponsorship', 48000.00, 'Corporate Transfer', TRUE, 'Gold Sponsor', '2024-03-09 00:00:00'),
('ENT008', 'Columbia University', 'enterprise', 'Educational Partnership', 30000.00, 'University Grant', TRUE, 'Academic Partner', '2024-03-08 00:00:00'),
('ENT009', 'NYU', 'enterprise', 'Educational Partnership', 28000.00, 'University Grant', TRUE, 'Academic Partner', '2024-03-07 00:00:00'),
('ENT010', 'Memorial Sloan Kettering', 'enterprise', 'Health Partnership', 25000.00, 'Healthcare Grant', TRUE, 'Health Partner', '2024-03-06 00:00:00'),
('ENT011', 'NYU Langone', 'enterprise', 'Health Partnership', 22000.00, 'Healthcare Grant', TRUE, 'Health Partner', '2024-03-05 00:00:00'),
('ENT012', 'IBM', 'enterprise', 'Annual Corporate Sponsorship', 42000.00, 'Corporate Transfer', TRUE, 'Silver Sponsor', '2024-03-04 00:00:00'),
('ENT013', 'Intel', 'enterprise', 'Annual Corporate Sponsorship', 38000.00, 'Corporate Transfer', TRUE, 'Silver Sponsor', '2024-03-03 00:00:00');

-- Views for easy querying
CREATE VIEW individual_donors AS
SELECT * FROM donors WHERE donor_type = 'individual' ORDER BY name;

CREATE VIEW enterprise_donors AS  
SELECT * FROM donors WHERE donor_type = 'enterprise' ORDER BY name;

CREATE VIEW donation_summary AS
SELECT 
    donor_type,
    COUNT(*) as donor_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount
FROM donors 
GROUP BY donor_type;