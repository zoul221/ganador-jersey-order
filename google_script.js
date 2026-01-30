
/** ==========================
 *  CONFIG + HEADER MANAGEMENT
 *  ========================== */

// ===== EMAIL CONFIGURATION =====
const RECIPIENT_EMAIL = Session.getActiveUser().getEmail(); // Email to receive order notifications (current user)

const FULL_HEADER = [
  'Timestamp',        // 1
  'Name',             // 2 (Orderer / Buyer name)
  'Number',           // 3
  'Size',             // 4
  'Name on Jersey',   // 5
  'Long Sleeve',      // 6 (Yes/No)
  'Muslimah',         // 7 (Yes/No)
  'Price',            // 8  (legacy: unit price per piece)
  'Paid',             // 9  (Yes/No)
  'ID',               // 10 (line item id)
  // --- multi-item support ---
  'Quantity',         // 11
  'UnitPrice',        // 12 (explicit unit price)
  'LineTotal',        // 13 (unit * qty)
  'OrderId',          // 14 (cart id)
  'Subtotal',         // 15 (cart subtotal)
  'DeliveryFee',      // 16
  'GrandTotal',       // 17
  // --- NEW order-level fields replicated per line ---
  'Fulfillment',      // 18 (delivery | pickup) // NEW
  'Delivery Address', // 19                      // NEW
  'Contact Phone'     // 20                      // NEW
];

function ensureHeader_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.appendRow(FULL_HEADER);
    return;
  }

  const existingRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  const existing = existingRange.getValues()[0];

  // If header is shorter than FULL_HEADER, extend it (preserve existing labels)
  if (existing.length < FULL_HEADER.length) {
    const extended = existing.slice();
    for (let i = existing.length; i < FULL_HEADER.length; i++) {
      extended[i] = FULL_HEADER[i];
    }
    sheet.getRange(1, 1, 1, extended.length).setValues([extended]);
  }
}

function headerIndexMap_(sheet) {
  ensureHeader_(sheet);
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  header.forEach((h, i) => (map[String(h).trim()] = i + 1)); // 1-based
  return map;
}

function yesNo_(val) {
  return val ? 'Yes' : 'No';
}

function toNumber_(v, fallback) {
  const n = Number(v);
  return isNaN(n) ? (fallback == null ? 0 : fallback) : n;
}

function toInt_(v, fallback) {
  const n = parseInt(v, 10);
  return isNaN(n) ? (fallback == null ? 0 : fallback) : n;
}

// Optional: compute price server-side for safety if client omits it
function computeUnitPrice_(it) {
  const size = String(it.size || '');
  let price = size.indexOf('yr') > -1 ? 38 : 50; // child vs adult
  if (it.isLongSleeve) price += 5;
  if (it.isMuslimah) price += 10;
  if (['4XL', '5XL', '6XL'].indexOf(size) > -1) price += 5;
  if (['7XL', '8XL'].indexOf(size) > -1) price += 10;
  return price;
}
/** =================
 *  EMAIL FUNCTIONS
 *  ================= */

function sendOrderNotificationEmail_(orderData, items) {
  try {
    Logger.log('Starting email send to: ' + RECIPIENT_EMAIL);
    
    const subject = `New Jersey Order - ${orderData.buyerName || 'Guest'}`;
    
    let emailBody = `<h2>New Jersey Order Received!</h2>\n`;
    emailBody += `<p><strong>Buyer Name:</strong> ${orderData.buyerName || 'N/A'}</p>\n`;
    emailBody += `<p><strong>Contact Phone:</strong> ${orderData.contactPhone || 'N/A'}</p>\n`;
    emailBody += `<p><strong>Order ID:</strong> ${orderData.orderId}</p>\n`;
    emailBody += `<p><strong>Timestamp:</strong> ${new Date(orderData.timestamp).toLocaleString()}</p>\n`;
    emailBody += `<hr>\n`;
    
    // Fulfillment details
    emailBody += `<h3>Delivery Details</h3>\n`;
    emailBody += `<p><strong>Type:</strong> ${orderData.fulfillment === 'delivery' ? '🚗 Delivery' : '🏪 Pickup'}</p>\n`;
    if (orderData.fulfillment === 'delivery') {
      emailBody += `<p><strong>Address:</strong> ${orderData.deliveryAddress || 'N/A'}</p>\n`;
    }
    emailBody += `<hr>\n`;
    
    // Items table
    emailBody += `<h3>Order Items</h3>\n`;
    emailBody += `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">\n`;
    emailBody += `<tr style="background-color:#f2f2f2;"><th>Number</th><th>Name on Jersey</th><th>Size</th><th>Qty</th><th>Unit Price</th><th>Options</th><th>Line Total</th></tr>\n`;
    
    items.forEach((item) => {
      const options = [];
      if (item.isLongSleeve) options.push('Long Sleeve');
      if (item.isMuslimah) options.push('Muslimah');
      const optionsStr = options.length ? options.join(', ') : 'Standard';
      
      emailBody += `<tr>`;
      emailBody += `<td>${item.number || '-'}</td>`;
      emailBody += `<td>${item.nameOnJersey || '-'}</td>`;
      emailBody += `<td>${item.size || '-'}</td>`;
      emailBody += `<td>${item.quantity || 1}</td>`;
      emailBody += `<td>$${Number(item.unitPrice || 0).toFixed(2)}</td>`;
      emailBody += `<td>${optionsStr}</td>`;
      emailBody += `<td>$${Number(item.lineTotal || 0).toFixed(2)}</td>`;
      emailBody += `</tr>\n`;
    });
    
    emailBody += `</table>\n`;
    emailBody += `<hr>\n`;
    
    // Payment summary
    emailBody += `<h3>Payment Summary</h3>\n`;
    emailBody += `<p><strong>Subtotal:</strong> $${Number(orderData.subtotal || 0).toFixed(2)}</p>\n`;
    emailBody += `<p><strong>Delivery Fee:</strong> $${Number(orderData.deliveryFee || 0).toFixed(2)}</p>\n`;
    emailBody += `<p style="font-size:18px;"><strong>Grand Total:</strong> $${Number(orderData.grandTotal || 0).toFixed(2)}</p>\n`;
    emailBody += `<p><strong>Paid:</strong> ${orderData.paid ? '✅ Yes' : '❌ No'}</p>\n`;
    
    Logger.log('Email subject: ' + subject);
    Logger.log('Sending email with ' + items.length + ' items');
    
    MailApp.sendEmail(RECIPIENT_EMAIL, subject, emailBody, {
      htmlBody: emailBody
    });
    
    Logger.log('Email sent successfully to ' + RECIPIENT_EMAIL);
    
  } catch (err) {
    Logger.log('ERROR sending email: ' + String(err));
    Logger.log('Stack trace: ' + err.stack);
  }
}
/** ======
 *  CORS
 *  ====== */


function doOptions(e) {
  // Preflight will still not include custom headers, which is fine if you proxy or don’t need preflight.
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function _json(obj, statusCode) {

 return ContentService.createTextOutput(JSON.stringify(obj))
  .setMimeType(ContentService.MimeType.JSON);

}

/** ======================
 *  POST (create / update)
 *  ====================== */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return _json({ success: false, message: 'No body' }, 400);
    }
    const data = JSON.parse(e.postData.contents);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const idx = headerIndexMap_(sheet);
    const lastRow = sheet.getLastRow();

    // DELETE by id or orderId
    if (data.action === 'delete') {
      return handleDelete_(sheet, idx, data);
    }

    // UPDATE PAID STATUS ONLY (preserve other fields)
    if (data.action === 'updatePaid') {
      return handleUpdatePaid_(sheet, idx, data);
    }

    // Support both: single object (legacy) and cart payload with items array
    if (Array.isArray(data.items) && data.items.length) {
      const orderId = data.orderId || Utilities.getUuid();
      const paid = !!data.paid;
      const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

      // CHANGED: Order-level fields (replicated on each row)
      const buyerName = (data.buyerName || '').trim();          // NEW
      const fulfillment = (data.fulfillment || '').trim();       // NEW: 'delivery' | 'pickup'
      const deliveryAddress = (data.deliveryAddress || '').trim(); // NEW
      const contactPhone = (data.contactPhone || '').trim();     // NEW

      // Build a quick in-memory index of existing IDs (for updates)
      const values = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues() : [];
      const idCol = idx['ID'];
      const existingIdToRow = {};
      for (let i = 0; i < values.length; i++) {
        const rowNum = i + 2;
        const idVal = values[i][idCol - 1];
        if (idVal) existingIdToRow[idVal] = rowNum;
      }

      const rowsToAppend = [];
      const rowsToUpdate = [];

      data.items.forEach((it) => {
        const id = it.id || Utilities.getUuid();
        const qty = toInt_(it.quantity, 1);
        const unitPrice = toNumber_(it.unitPrice, computeUnitPrice_(it));
        const lineTotal = toNumber_(it.lineTotal, unitPrice * qty);
        const paidFlag = it.paid != null ? !!it.paid : paid;

        // Prepare full row shaped to FULL_HEADER
        const row = [];
        row[idx['Timestamp'] - 1]      = timestamp;
        // CHANGED: "Name" now stores the orderer's name (buyerName); fallback to it.name for legacy
        row[idx['Name'] - 1]           = buyerName || it.name || ''; // NEW/CHANGED
        row[idx['Number'] - 1]         = it.number || '';
        row[idx['Size'] - 1]           = it.size || '';
        row[idx['Name on Jersey'] - 1] = it.nameOnJersey || '';
        row[idx['Long Sleeve'] - 1]    = yesNo_(it.isLongSleeve);
        row[idx['Muslimah'] - 1]       = yesNo_(it.isMuslimah);
        row[idx['Price'] - 1]          = unitPrice; // keep legacy "Price" as unit price
        row[idx['Paid'] - 1]           = yesNo_(paidFlag);
        row[idx['ID'] - 1]             = id;

        // New columns
        row[idx['Quantity'] - 1]       = qty;
        row[idx['UnitPrice'] - 1]      = unitPrice;
        row[idx['LineTotal'] - 1]      = lineTotal;
        row[idx['OrderId'] - 1]        = orderId;
        row[idx['Subtotal'] - 1]       = toNumber_(data.subtotal, '');
        row[idx['DeliveryFee'] - 1]    = toNumber_(data.deliveryFee, '');
        row[idx['GrandTotal'] - 1]     = toNumber_(data.grandTotal, '');

        // NEW: replicate order-level fields on each line
        if (idx['Fulfillment'])       row[idx['Fulfillment'] - 1]       = fulfillment;
        if (idx['Delivery Address'])  row[idx['Delivery Address'] - 1]  = deliveryAddress;
        if (idx['Contact Phone'])     row[idx['Contact Phone'] - 1]     = contactPhone;

        // Update existing row if id found; else append later
        const existingRowNum = existingIdToRow[id];
        if (existingRowNum) {
          rowsToUpdate.push({ rowNum: existingRowNum, rowValues: row });
        } else {
          rowsToAppend.push(row);
        }
      });

      // Batch updates
      rowsToUpdate.forEach(({ rowNum, rowValues }) => {
        sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).setValues([rowValues]);
      });

      // Batch append
      if (rowsToAppend.length) {
        sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, sheet.getLastColumn()).setValues(rowsToAppend);
        
        // Send email notification only when NEW orders are created
        sendOrderNotificationEmail_(data, data.items);
      }

      return _json({ success: true, appended: rowsToAppend.length, updated: rowsToUpdate.length });
    }

    // Legacy single object (upsert by ID)
    return upsertSingle_(sheet, idx, data);

  } catch (err) {
    return _json({ success: false, message: String(err) }, 500);
  }
}

/**
 * Handle updating only the Paid status, preserving all other fields
 */
function handleUpdatePaid_(sheet, idx, data) {
  const id = data.id;
  const newPaidStatus = yesNo_(data.paid === 'Yes');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return _json({ success: false, message: 'No data found' }, 404);
  }

  // Find the row with matching ID
  const idCol = idx['ID'];
  const values = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
  let foundRow = 0;
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      foundRow = i + 2;
      break;
    }
  }

  if (!foundRow) {
    return _json({ success: false, message: 'Order not found' }, 404);
  }

  // Update only the Paid column
  const paidColIndex = idx['Paid'];
  sheet.getRange(foundRow, paidColIndex).setValue(newPaidStatus);

  return _json({ success: true, updated: true, id: id });
}


function upsertSingle_(sheet, idx, data) {
  const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
  const id = data.id || Utilities.getUuid();
  const paid = yesNo_(!!data.paid);
  const longSleeve = yesNo_(!!data.isLongSleeve);
  const muslimah = yesNo_(!!data.isMuslimah);
  const unitPrice = toNumber_(data.price, computeUnitPrice_(data)); // legacy "price" is unit price

  // Try find existing by ID
  const lastRow = sheet.getLastRow();
  let foundRow = 0;
  if (lastRow >= 2) {
    const idCol = idx['ID'];
    const values = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0]) == String(id)) {
        foundRow = i + 2;
        break;
      }
    }
  }

  const row = new Array(sheet.getLastColumn()).fill('');
  row[idx['Timestamp'] - 1]      = timestamp;
  // CHANGED: prefer buyerName (if provided), fallback to legacy 'name'
  row[idx['Name'] - 1]           = (data.buyerName || data.name || '');
  row[idx['Number'] - 1]         = data.number || '';
  row[idx['Size'] - 1]           = data.size || '';
  row[idx['Name on Jersey'] - 1] = data.nameOnJersey || '';
  row[idx['Long Sleeve'] - 1]    = longSleeve;
  row[idx['Muslimah'] - 1]       = muslimah;
  row[idx['Price'] - 1]          = unitPrice; // legacy
  row[idx['Paid'] - 1]           = paid;
  row[idx['ID'] - 1]             = id;

  // NEW: accept optional order-level fields in legacy upsert too
  if (idx['Fulfillment'])       row[idx['Fulfillment'] - 1]       = (data.fulfillment || '');
  if (idx['Delivery Address'])  row[idx['Delivery Address'] - 1]  = (data.deliveryAddress || '');
  if (idx['Contact Phone'])     row[idx['Contact Phone'] - 1]     = (data.contactPhone || '');

  if (foundRow) {
    sheet.getRange(foundRow, 1, 1, sheet.getLastColumn()).setValues([row]);
  } else {
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, sheet.getLastColumn()).setValues([row]);
  }

  return _json({ success: true, updated: !!foundRow, id: id });
}

function handleDelete_(sheet, idx, data) {
  const idCol = idx['ID'];
  const orderIdCol = idx['OrderId'];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return _json({ success: false, message: 'No data' }, 404);
  }

  // Delete by orderId (multiple rows)
  if (data.orderId) {
    const values = sheet.getRange(2, orderIdCol, lastRow - 1, 1).getValues();
    const rowsToDelete = [];
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0]) === String(data.orderId)) {
        rowsToDelete.push(i + 2);
      }
    }
    // Delete bottom-up to keep indices valid
    rowsToDelete.sort((a, b) => b - a).forEach((r) => sheet.deleteRow(r));
    return _json({ success: true, deletedCount: rowsToDelete.length });
  }

  // Delete by single line item id (legacy)
  if (data.id) {
    const values = sheet.getRange(2, idCol, lastRow - 1, 1).getValues();
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0]) === String(data.id)) {
        sheet.deleteRow(i + 2);
        return _json({ success: true, deleted: true });
      }
    }
    return _json({ success: false, message: 'Order not found' }, 404);
  }

  return _json({ success: false, message: 'Missing id or orderId for delete' }, 400);
}

/** ============
 *  GET (read)
 *  ============ */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const idx = headerIndexMap_(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return _json({ orders: [] });
    }

    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    const orders = data.map((row) => ({
      // legacy keys (kept for compatibility)
      timestamp: row[idx['Timestamp'] - 1] || '',
      name: row[idx['Name'] - 1] || '', // buyerName stored here now
      number: row[idx['Number'] - 1] || '',
      size: row[idx['Size'] - 1] || '',
      nameOnJersey: row[idx['Name on Jersey'] - 1] || '',
      isLongSleeve: row[idx['Long Sleeve'] - 1] || '',
      isMuslimah: row[idx['Muslimah'] - 1] || '',
      price: row[idx['Price'] - 1] || '',
      paid: row[idx['Paid'] - 1] || '',
      id: row[idx['ID'] - 1] || '',
      quantity: row[idx['Quantity'] - 1] || '',
      unitPrice: row[idx['UnitPrice'] - 1] || '',
      lineTotal: row[idx['LineTotal'] - 1] || '',
      orderId: row[idx['OrderId'] - 1] || '',
      subtotal: row[idx['Subtotal'] - 1] || '',
      deliveryFee: row[idx['DeliveryFee'] - 1] || '',
      grandTotal: row[idx['GrandTotal'] - 1] || '',
      // NEW explicit keys for new UI
      buyerName: row[idx['Name'] - 1] || '', // same as name
      fulfillment: idx['Fulfillment'] ? (row[idx['Fulfillment'] - 1] || '') : '',
      deliveryAddress: idx['Delivery Address'] ? (row[idx['Delivery Address'] - 1] || '') : '',
      contactPhone: idx['Contact Phone'] ? (row[idx['Contact Phone'] - 1] || '') : ''
    }));

    return _json({ orders: orders });
  } catch (err) {
    return _json({ orders: [], error: String(err) }, 500);
  }
}
