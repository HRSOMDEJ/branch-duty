/**
 * config.js — ลิงก์ระบบหลังบ้าน (Google Apps Script Web App)
 * วิธีหา: เปิดโปรเจกต์ Apps Script > Deploy > Manage deployments > คัดลอก Web app URL ที่ลงท้ายด้วย /exec
 * แล้ววางแทนข้อความ ใส่ลิงก์ที่นี่ ด้านล่าง (อยู่ในเครื่องหมาย ' ')
 */
var API_URL = 'ใส่ลิงก์ที่นี่';
if (!/^https:\/\/script\.google\.com\//.test(API_URL)) API_URL = '';
