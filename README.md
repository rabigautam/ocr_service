TASK:
OCR API Documentation: Nepali-English OCR API - Swagger UI

Existing OCR API Behavior
Endpoint: /api/v1/extract post request
Method: post
Accepts an image file in the request body
Processing time is relatively high (~50–60 seconds per request)
Your Task
Create a new API service that:
Accepts image uploads from clients
Calls the existing OCR API internally
Handles the long-running processing efficiently
Stores necessary request/response data in PostgreSQL
Returns OCR results appropriately


















Assignment:

# Asynchronous OCR Processing Proxy Service

An architectural intermediary middleware service built using **NestJS**, **RabbitMQ**, and **PostgreSQL (via Prisma)**. It is explicitly designed to handle long-running (50–60 seconds) external OCR API processing tasks reliably, ensuring high system responsiveness, data persistence, and real-time client status synchronization.

---

## System Architecture & Design

{ Client ]
│
│ 1. POST /api/v1/ocr/upload (Multipart Image)
▼
[ NestJS Ingestion Controller ]
│
├─► 2. Persists initial record in PostgreSQL as 'QUEUED'
├─► 3. Publishes tracking job payload into RabbitMQ Broker
│
▼ (Immediate HTTP 202 Accepted Response returned with UUID Tracking Token)
[ Client receives Job ID ]

====== ASYNCHRONOUS BACKGROUND LAYER ======

[ RabbitMQ Queue (ocr_job_queue) ] ◄── Durably holds job messages
│
▼ 4. Consumed by background process
[ NestJS Worker Process (OcrProcessor) ]
│
├─► 5. Emits WebSockets event: 'PROCESSING'
├─► 6. Executes Multi-Part POST to Third-Party OCR Target API
│      │
│      └─► [ Exponential Backoff + Jitter Retry Loop on Network/API Fails ]
│
├─► 7. Atomically saves text payload and updates DB to 'COMPLETED'
└─► 8. Emits WebSockets event: 'COMPLETED' with extracted text content


### Core Architecture Features:
* **Immediate Responsiveness:** Decouples file ingestion from execution. The API accepts requests instantly, offloads workloads, and returns an execution receipt, avoiding lingering open HTTP threads and connection dropouts.
* **Resilient Worker Design:** Implements an automated **Exponential Backoff with Jitter** retry routine over the 3rd party vendor endpoints to protect the system against localized downstream socket timeouts.
* **Database State Tracking:** Utilizes structured PostgreSQL schemas to keep track of historical logs (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`), making auditing easy.
* **Realtime Event Streams:** Emits focused event-driven updates directly back to users using persistent `Socket.io` instances.

---

##  Prerequisites

Before starting up the application workspace, ensure your hosting server contains active, running instances of:
* **Node.js** (v18.x or higher)
* **PostgreSQL Engine** (v14 or higher)
* **RabbitMQ Server Broker** (Standard AMQP Protocol on Port `5672`)

---

## ⚙️ Project Configuration

1. Create a clean environment file by copying the distributed template profile:
   ```bash
   cp .env.example .env
Open up .env and specify your infrastructure connection credentials and target API routes:

Code snippet
# Application Execution Mode
PORT=3000
NODE_ENV=development

# PostgreSQL Relational Storage Engine Data Source URL
DATABASE_URL="postgresql://postgres:your_secure_password@localhost:5432/ocr_db?schema=public"

# Message Queue Routing Broker Engine Address
RABBITMQ_URL="amqp://localhost:5672"

# Target External OCR Gateway Service API 
OCR_API_URL=https://pos-ocr.vedastudios.com.np/api/v1/extract
 Installation & Bootstrapping
Follow these sequential steps to initialize dependency trees, run schemas, and boot the application up:

Bash
# 1. Install required ecosystem dependencies
npm install

# 2. Synchronize Prisma data models with your PostgreSQL instance
npx prisma migrate dev --name init

# 3. Compile and launch the microservice cluster in Hot-Reload Development Watch mode
npm run start:dev
 Postman Verification & Integration Playbook
Use this step-by-step testing blueprint inside Postman to verify the asynchronous integration flow using your sample documents.

Phase 1: Uploading and Enqueueing a Document
Open a new request tab inside your Postman workspace collection and initialize a POST request.

Route the destination URL address string to: http://localhost:3000/api/v1/ocr/upload

Select the Body metadata parameter configurations tab, and toggle the encoding type bullet selector to form-data.

In the key input row field, name the entry index key variable file. Change the key type dropdown property setting from Text to File.

Click Select Files and choose one of your sample test receipts (e.g., GnMmVF_acAA8sYA 2.jpg or images 1.jpg).

Click Send.

Expected Ingestion Response:
JSON
{
  "jobId": "8f2b7d34-7c64-4e31-89b2-3c11a689bdf2",
  "status": "QUEUED"
}
Take note of the generated jobId UUID token string value returned; it will act as your transactional receipt listener.

Phase 2: Intercepting Real-Time Updates via WebSockets
To listen for processing stages without resorting to continuous database polling:

Click New in the top-left section toolbar of Postman and select Socket.IO Request.

Configure the target Server URL address field to point to your live microservice gateway:

ws://localhost:3000
Click Connect to initialize the active persistent TCP protocol connection handshakes.

Locate the Listeners subscription configuration parameters card interface table directly below.

In the Event Name input field, craft a channel target string by combining the event name signature with your tracking identifier token (e.g., ocr-status:<YOUR_JOB_ID>):

Plaintext
ocr-status:8f2b7d34-7c64-4e31-89b2-3c11a689bdf2
Click + Add.

Now, when a background consumer worker fetches that work entry from RabbitMQ, your Postman interface terminal window panel logs live runtime state changes:

In-Flight Status Log Event:
JSON
{
  "jobId": "8f2b7d34-7c64-4e31-89b2-3c11a689bdf2",
  "status": "PROCESSING"
}
Phase 3: Sample Extracted Data Scenarios
Depending on which sample image you uploaded in Phase 1, your terminal execution success event (~50s later) will output structural results like the examples below:

Scenario A: Standard English Text Receipt (GnMmVF_acAA8sYA 2.jpg)
JSON
{
  "jobId": "8f2b7d34-7c64-4e31-89b2-3c11a689bdf2",
  "status": "COMPLETED",
  "text": "EPIC STEAKHOUSE\n369 THE EMBARCADERO\nSAN FRANCISCO, CA 94105\n\n2 FILET MIGNON $98.00\n1 RIB EYE $52.00\n1 CAESAR SALAD $14.50\n1 CREAMED SPINACH $11.00\n1 BAKED POTATO $9.50\n\nSUBTOTAL $185.00\nTAX 17.02\nTIP $75.00\nTOTAL $277.02"
}
Scenario B: Mixed Language / Nepali Tax Invoice (images 1.jpg)
JSON
{
  "jobId": "bc1483a2-2b11-456c-ba32-44111cd99bf0",
  "status": "COMPLETED",
  "text": "Tax Invoice\nTHE BAKERY CAFE PVT.LTD.\nMAHARAJGUNJ, KATHMANDU, NEPAL\nPAN NO: 300058215\nBill No: 7785  TABLE 11\n\nCKN CHILLI BL 1 350.00\nVEG MANCHURIAN 1 250.00\nVEG FRY RICE 2 450.00\nCKN SIZZLER 1 525.00\nFP CKN MOMO 1 995.00\n\nSUB TOTAL 2570.00\nSC 10% 257.00\nVAT 13% 367.51\nGRAND TOTAL 3194.51"
}

# Retry Policy 

[Network Request Fails] 
          │
          ▼
[Check: Attempt >= MAX_RETRIES (3)?] ────► YES ──► Fail Job & Drop from Queue
          │
          ▼ NO
[Calculate Exponential Backoff Delay]
          │
          ▼
[Inject Random Jitter (0 - 1000ms)]
          │
          ▼
[Emit 'retrying_attempt_x' via WS]
          │
          ▼
[Sleep & Open Fresh File Stream] ──► Recurse to Next Network Attempt