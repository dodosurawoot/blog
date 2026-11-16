# BioLab 2570 — ระบบ Google Student + GitHub Admin (เตรียมติดตั้ง)

## ระบบ
- หน้าเว็บสอบ A-Level ชีววิทยา: HTML/CSS/JS บน GitHub Pages
- Firebase Authentication: Google (ผู้สอบ) และ GitHub (Admin)
- Cloud Firestore: บันทึกคะแนนแบบต่อครั้ง
- Dashboard: รายชื่อผู้สอบ ประวัติ คะแนนเฉลี่ย เวลาสอบ ค้นหา Export CSV
- Admin: เฉพาะ GitHub account ID \`19434459\` (dodosurawoot) ตาม Firestore Rules

## ตั้งค่า Firebase ก่อนเปิดใช้จริง
1. ไปที่ https://console.firebase.google.com/ สร้าง Firebase project และเพิ่ม Web App
2. นำค่า apiKey, authDomain, projectId, appId จาก **Project settings > Your apps > SDK setup and configuration > Config** ใส่ในไฟล์ firebase-config.js (ค่า config เหล่านี้ใช้ฝั่ง client ได้ ไม่ใช่รหัสลับ)
3. Firebase Console > Authentication > Sign-in method: เปิด **Google**
4. ไปที่ https://github.com/settings/developers > New OAuth App สร้าง GitHub OAuth App:
   - Homepage URL: URL ของเว็บสอบ GitHub Pages
   - Authorization callback URL: \`https://<FIREBASE_PROJECT_ID>.firebaseapp.com/__/auth/handler\`
   - นำ GitHub OAuth Client ID และ Client Secret ไปใส่ **เฉพาะใน Firebase Console > Authentication > GitHub provider** เท่านั้น
   - ห้ามเก็บ Client Secret ใน repository ที่เปิด public
5. Firebase Console > Authentication > Settings > Authorized domains: เพิ่ม \`dodosurawoot.github.io\` และโดเมนอื่นที่ใช้
6. Firebase Console > Firestore Database: Create database เลือก region; ที่แท็บ **Rules** นำเนื้อหาจาก firestore.rules วางและ Publish
7. GitHub > repository \`dodosurawoot/blog\` > Settings > Pages: ตรวจสอบ branch และ URL ที่เผยแพร่ (feature branch นี้ไม่ใช่เว็บ production)
8. ทดลอง Google Login ผู้สอบและ GitHub Login ด้วยบัญชี \`dodosurawoot\`; ตรวจว่าบัญชีอื่นไม่เห็น Admin Dashboard

## สำคัญ
- โจทย์และคำตอบอยู่ใน JavaScript ที่ส่งไปเบราว์เซอร์ ทำให้ผู้ใช้งานที่มีความรู้เทคนิคสามารถแก้คะแนนที่ส่งจาก client ได้ **จึงเหมาะกับ mock exam ไม่ใช่สอบคุมสอบ/กันโกง** หากต้องการความน่าเชื่อถือ ต้องย้ายการตรวจคำตอบไปยัง backend หรือ Cloud Functions
- ผลสอบยังถูกเก็บใน localStorage ระหว่างทำ และผูกกับ Firebase UID ของผู้สอบเมื่อเปิดระบบ Cloud
- Google/GitHub login หากใช้อีเมลเดียวกันทั้งสอง provider อาจพบ auth/account-exists-with-different-credential จำเป็นต้องเชื่อมบัญชีหรือใช้คนละบัญชี
- ค่าบริการของ Firebase ขึ้นกับแผนและปริมาณการใช้งาน ตรวจสอบราคา/โควต้าก่อนเปิดใช้งาน
- ถ้ายังไม่ได้ใส่ Firebase config หน้าเว็บจะยังทำข้อสอบ local ได้ แต่ปุ่ม Login ถูกปิดและคะแนนยังไม่ขึ้น Dashboard
