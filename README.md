# 🚗 ระบบเช็กน้ำท่วมตามเส้นทาง (77 จังหวัดทั่วไทย + กทม.)
### Realtime Route Flood Check System (Bangkok + Thailand Highways)

ระบบช่วยตรวจสอบความเสี่ยงน้ำท่วมและระดับน้ำขังตามเส้นทางขับขี่ ครอบคลุมทั้งกรุงเทพมหานคร (BMA Sensor Directus API) และทางหลวงต่างจังหวัด 77 จังหวัดทั่วไทย (กรมทางหลวง DOH HDMS API) พร้อมคำนวณความสูงน้ำเทียบกับประเภทรถยนต์ (รถเก๋ง / SUV / มอเตอร์ไซค์) และแสดงผลบนแผนที่แบบ Interactive

---

## 🌟 ฟีเจอร์หลัก (Key Features)

- 🗺️ **Visualized Map (Leaflet.js + Esri Dark Canvas)**: แสดงจุดน้ำท่วมและเส้นทางขับขี่บนแผนที่แบบเรียลไทม์ พร้อมปุ่มสลับแผนที่ (Dark Mode / OpenStreetMap / OSM HOT / Satellite)
- 🚘 **Vehicle Passability Evaluation**: ประเมินความเสี่ยงน้ำท่วมแยกตามประเภทยานพาหนะ:
  - 🚗 **รถเก๋ง (Sedan / Hatchback)**: น้ำท่วมสูง $\ge 15$ ซม. เริ่มต้องเฝ้าระวัง / $\ge 30$ ซม. ผ่านไม่ได้
  - 🚙 **รถ SUV / กระบะ (Pickup)**: น้ำท่วมสูง $\ge 25$ ซม. เริ่มต้องเฝ้าระวัง / $\ge 45$ ซม. ผ่านไม่ได้
  - 🛵 **มอเตอร์ไซค์ (Motorcycle)**: น้ำท่วมสูง $\ge 10$ ซม. เริ่มต้องเฝ้าระวัง / $\ge 20$ ซม. ผ่านไม่ได้
- 🛣️ **OSRM Route Engine**: คำนวณเส้นทางขับขี่อัตโนมัติ พร้อมตรวจจับจุดน้ำท่วมในระยะ 2.5 กม. จากเส้นทาง
- 📲 **Direct Navigation**: ปุ่มกดเปิด Google Maps และ Waze นำทางจริงได้ทันทีในแท็บใหม่
- ☁️ **Google Drive Sync (Apps Script)**: ดึงข้อมูลสดผ่าน Browser Client และซิงค์เก็บไว้ใน Google Drive ส่วนตัวโดยไม่ต้องเสียค่าบริการ API
- 🆓 **100% Free**: ไม่ต้องใช้ API Key, ไม่ต้องกรอกบัตรเครดิต, ไม่มีค่าใช้จ่ายซ่อนแอบ

---

## 📁โครงสร้างไฟล์ใน Project

- `index.html` - หน้าเว็บหลัก (Single Page Web Application)
- `flood_data.json` - ข้อมูลจุดน้ำท่วมสำรอง (Fallback Dataset)
- `GoogleAppsScript.gs` - สคริปต์สำหรับติดตั้งบน Google Apps Script เพื่อซิงค์ข้อมูลลง Google Drive
- `README.md` - คำแนะนำการใช้งานและการติดตั้ง

---

## 🚀 วิธีตั้งค่าและการเปิดใช้งานบน GitHub Pages

### Step 1: Push ไฟล์ขึ้น GitHub
```bash
git init
git add index.html flood_data.json GoogleAppsScript.gs README.md
git commit -m "Initial commit: Route Flood Check System"
git branch -M main
git remote add origin https://github.com/invalder/flood-route-check.git
git push -u origin main
```

### Step 2: ตั้งค่า Google Apps Script (ถ้าต้องการซิงค์ Google Drive)
1. ไปที่ [Google Apps Script](https://script.google.com/) แล้วสร้าง New Project
2. ก๊อปปี้โค้ดจากไฟล์ `GoogleAppsScript.gs` ไปวาง
3. กด **Deploy > New deployment** -> เลือก **Web app**
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. คัดลอก Web App URL (เช่น `https://script.google.com/macros/s/AKfycbx.../exec`)
5. นำ URL ไปวางใน `index.html` ตรงบรรทัด:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_DEPLOYED_WEB_APP_URL_HERE';
   ```

### Step 3: เปิดใช้งาน GitHub Pages
1. ไปที่ Repository ของคุณใน GitHub: `https://github.com/invalder/flood-route-check`
2. ไปที่เมนู **Settings** -> **Pages** (ทางแถบซ้าย)
3. หัวข้อ **Build and deployment** -> เลือก Branch: `main` และโฟลเดอร์ `/ (root)`
4. กด **Save**

🎉 เข้าใช้งานเว็บของคุณได้ฟรีทันทีที่: `https://invalder.github.io/flood-route-check/`
