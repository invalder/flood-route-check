/**
 * ==============================================================================
 * ระบบอัปเดตข้อมูลน้ำท่วมลง Google Drive (BMA + DOH)
 * ==============================================================================
 * 
 * เนื่องจากเซิร์ฟเวอร์ กทม. (Cloudflare) และ กรมทางหลวง มีการบล็อก IP ของ Google Cloud/Apps Script
 * สคริปต์นี้ถูกออกแบบให้รองรับ 2 ระบบร่วมกัน:
 * 1. Web App API Endpoint (doPost/doGet): ให้หน้าเว็บ (ซึ่งทำงานบนไอพีเบราว์เซอร์ของคุณที่ไม่โดนบล็อก)
 *    ดึงข้อมูลสดแล้วส่งมาบันทึกลงไฟล์ JSON บน Google Drive ให้อัตโนมัติ 100%
 * 2. Hourly Trigger (update): ระบบรันตามเวลาเพื่อรักษาข้อมูลเดิม (Fallback)
 * 
 * วิธีติดตั้ง Web App (แนะนำสูงสุด):
 * 1. วางโค้ดนี้ลงใน Google Apps Script (Code.gs) แล้วใส่ FILE_ID ของไฟล์ flood_data.json บน Drive
 * 2. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) -> "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 3. เลือกประเภท "เว็บแอป" (Web App)
 *    - ทำงานในฐานะ: "ฉัน" (Me)
 *    - ผู้มีสิทธิ์เข้าถึง: "ทุกคน" (Anyone)
 * 4. คัดลอก URL ของ Web App ไปใส่ในหน้า index.html ช่อง "ตั้งค่า Web App Sync"
 * ==============================================================================
 */

// ใส่ ID ของไฟล์ JSON บน Google Drive ของคุณตรงนี้
const FILE_ID = 'YOUR_GOOGLE_DRIVE_FILE_ID';

/**
 * Web App POST Handler: รับข้อมูลสดจากเบราว์เซอร์ของผู้ใช้ แล้วบันทึกลง Google Drive
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No post data' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents);
    const nowIso = new Date().toISOString();

    const outputJson = {
      version: 1,
      fetchedAt: nowIso,
      errors: payload.errors || [],
      bma: {
        source: 'https://floodbangkok.bangkok.go.th',
        updatedAt: nowIso,
        points: payload.bmaPoints || []
      },
      doh: {
        source: 'https://hdms.doh.go.th',
        updatedAt: nowIso,
        points: payload.dohPoints || []
      }
    };

    if (FILE_ID && FILE_ID !== 'YOUR_GOOGLE_DRIVE_FILE_ID') {
      const file = DriveApp.getFileById(FILE_ID);
      file.setContent(JSON.stringify(outputJson, null, 2));
      Logger.log('บันทึกข้อมูลจาก Browser Sync ลง Google Drive สำเร็จ!');
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Updated Google Drive successfully',
      bmaCount: (payload.bmaPoints || []).length,
      dohCount: (payload.dohPoints || []).length,
      updatedAt: nowIso
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Web App GET Handler: ส่งคืนข้อมูลในไฟล์ JSON บน Google Drive
 */
function doGet(e) {
  try {
    if (FILE_ID && FILE_ID !== 'YOUR_GOOGLE_DRIVE_FILE_ID') {
      const file = DriveApp.getFileById(FILE_ID);
      const content = file.getBlob().getDataAsString();
      return ContentService.createTextOutput(content)
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ error: 'FILE_ID not configured' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ฟังก์ชันตั้งค่า Trigger ลบเก่า -> สร้างใหม่ทุก 1 ชม.
 */
function setup() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'update') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('update').timeBased().everyHours(1).create();
  Logger.log('ตั้งค่า Trigger 1 ชั่วโมงเรียบร้อย');
  update();
}

/**
 * ฟังก์ชันหลักในการรันตามเวลา (ใช้เป็น Fallback รักษาน้ำท่วมรอบก่อนหน้าหากต่อตรงไม่ผ่าน)
 */
function update() {
  const errors = [];
  const now = new Date();
  const nowIso = now.toISOString();

  let previousJson = null;
  let file = null;
  try {
    if (FILE_ID && FILE_ID !== 'YOUR_GOOGLE_DRIVE_FILE_ID') {
      file = DriveApp.getFileById(FILE_ID);
      const content = file.getBlob().getDataAsString();
      if (content && content.trim().length > 0) {
        previousJson = JSON.parse(content);
      }
    }
  } catch (e) {
    Logger.log('ไม่สามารถอ่านไฟล์เดิมได้: ' + e.message);
  }

  // รักษาน้ำท่วมเดิมไว้
  const bmaPoints = previousJson?.bma?.points || [];
  const dohPoints = previousJson?.doh?.points || [];

  const outputJson = {
    version: 1,
    fetchedAt: nowIso,
    errors: ['IP Google Cloud ติดบล็อก Cloudflare/Firewall - โปรดใช้การซิงก์ผ่านหน้า Artifact/Web App'],
    bma: {
      source: 'https://floodbangkok.bangkok.go.th',
      updatedAt: previousJson?.bma?.updatedAt || nowIso,
      points: bmaPoints
    },
    doh: {
      source: 'https://hdms.doh.go.th',
      updatedAt: previousJson?.doh?.updatedAt || nowIso,
      points: dohPoints
    }
  };

  if (file) {
    file.setContent(JSON.stringify(outputJson, null, 2));
  }
}
