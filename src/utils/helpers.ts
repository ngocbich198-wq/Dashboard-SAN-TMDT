import { Order } from '../types';

// Helper to format currency in VND
export function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value);
}

// Helper to format weight (grams to kg if >= 1000g)
export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kg`;
  }
  return `${grams.toLocaleString('vi-VN')} g`;
}

// Remove accents / diacritics from Vietnamese string for fuzzy comparison
export function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, m => m === 'đ' ? 'e' : 'D') // wait, đ usually maps to d, let's make it 'd'
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Map a raw header to our standard Order keys
export function normalizeHeader(rawHeader: string): keyof Order | null {
  const clean = removeAccents(rawHeader.trim().toLowerCase())
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/__+/g, '_');

  // Exact or contains match
  if (clean === 'ma_phieugui' || clean.includes('phieu') || clean.includes('receipt') || clean.includes('barcode') || clean.includes('bill')) {
    return 'ma_phieugui';
  }
  if (clean === 'ma_buucu' || clean.includes('buu_cu') || clean.includes('post') || clean.includes('office') || clean.includes('zip')) {
    return 'ma_buucu';
  }
  if (clean === 'time_nhap_may' || clean.includes('time') || clean.includes('nhap_may') || clean.includes('ngay') || clean.includes('date') || clean.includes('gio')) {
    return 'time_nhap_may';
  }
  if (clean === 'ma_khgui' || clean.includes('ma_kh') || clean.includes('sender_id') || clean.includes('customer_id')) {
    return 'ma_khgui';
  }
  if (clean === 'ten_khgui' || clean.includes('ten_kh') || clean.includes('customer_name') || clean.includes('sender_name') || clean.includes('ten_khach')) {
    return 'ten_khgui';
  }
  if (clean === 'trong_luong' || clean.includes('trong_luong') || clean.includes('khoi_luong') || clean.includes('weight') || clean.includes('mass')) {
    return 'trong_luong';
  }
  if (clean === 'tong_cuoc' || clean.includes('cuoc') || clean.includes('fee') || clean.includes('cost') || clean.includes('price')) {
    return 'tong_cuoc';
  }
  if (clean === 'san' || clean.includes('san') || clean.includes('platform') || clean.includes('ecommerce') || clean.includes('shopee') || clean.includes('lazada') || clean.includes('tiktok')) {
    return 'SAN';
  }

  return null;
}

// Custom CSV/TSV Parser that works on comma, semi-colon, and tab-separated text
export function parseImportText(text: string): { orders: Order[]; errors: string[] } {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length < 2) {
    return { orders: [], errors: ["Dữ liệu phải có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu."] };
  }

  // Detect delimiter (tab vs comma vs semicolon)
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (firstLine.includes(';')) {
    delimiter = ';';
  }

  // Helper to split a CSV line handling quotes
  const splitCSVLine = (line: string, delim: string): string[] => {
    const result: string[] = [];
    let insideQuote = false;
    let entry = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === delim && !insideQuote) {
        result.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    result.push(entry.trim());
    return result;
  };

  const headers = splitCSVLine(firstLine, delimiter);
  const headerMap: { [colIndex: number]: keyof Order } = {};
  const unmapped: string[] = [];

  headers.forEach((h, index) => {
    const mapped = normalizeHeader(h);
    if (mapped) {
      headerMap[index] = mapped;
    } else {
      unmapped.push(h);
    }
  });

  // Verify we got the vital headers
  const mappedKeys = Object.values(headerMap);
  const missing: string[] = [];
  if (!mappedKeys.includes('ma_phieugui')) missing.push('Mã phiếu gửi (ma_phieugui)');
  if (!mappedKeys.includes('tong_cuoc')) missing.push('Tổng cước (tong_cuoc)');
  
  if (missing.length > 0) {
    return {
      orders: [],
      errors: [`Không tìm thấy các cột bắt buộc: ${missing.join(', ')}. Các cột tiêu đề tìm thấy: ${headers.join(', ')}`]
    };
  }

  const parsedOrders: Order[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowValues = splitCSVLine(lines[i], delimiter);
    if (rowValues.length < 2 || (rowValues.length === 1 && rowValues[0] === '')) {
      continue; // Skip blank rows
    }

    const orderObj: Partial<Order> = {
      ma_phieugui: '',
      ma_buucu: 'BC_KHAC',
      time_nhap_may: new Date().toISOString().slice(0, 19), // default today
      ma_khgui: 'KH_KHAC',
      ten_khgui: 'Khách hàng Vãng lai',
      trong_luong: 0,
      tong_cuoc: 0,
      SAN: 'Ngoài Sàn'
    };

    let hasData = false;

    rowValues.forEach((val, index) => {
      const key = headerMap[index];
      if (!key) return;
      hasData = true;

      if (key === 'trong_luong' || key === 'tong_cuoc') {
        // Parse numbers safely, removing currency signs, commas, spaces
        const numStr = val.replace(/[^0-9.-]/g, '');
        const num = parseFloat(numStr);
        orderObj[key] = isNaN(num) ? 0 : num;
      } else if (key === 'time_nhap_may') {
        // Try parsing dates or default
        if (val) {
          try {
            // Check if format is DD/MM/YYYY HH:MM or similar
            const dMyMatch = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
            if (dMyMatch) {
              const [_, day, month, year, hour = '12', min = '00', sec = '00'] = dMyMatch;
              const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${min.padStart(2, '0')}:${sec.padStart(2, '0')}`;
              orderObj.time_nhap_may = iso;
            } else {
              const date = new Date(val);
              if (!isNaN(date.getTime())) {
                const pad = (n: number) => String(n).padStart(2, '0');
                const localStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
                orderObj.time_nhap_may = localStr;
              } else {
                orderObj.time_nhap_may = val;
              }
            }
          } catch (err) {
            const now = new Date();
            const pad = (n: number) => String(n).padStart(2, '0');
            orderObj.time_nhap_may = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
          }
        }
      } else if (key === 'SAN') {
        // Normalize Sàn name
        const sanLower = val.toLowerCase();
        if (sanLower.includes('shopee')) orderObj.SAN = 'Shopee';
        else if (sanLower.includes('lazada') || sanLower.includes('laz')) orderObj.SAN = 'Lazada';
        else if (sanLower.includes('tiktok')) orderObj.SAN = 'TikTok';
        else if (sanLower.includes('tiki')) orderObj.SAN = 'Tiki';
        else orderObj.SAN = val || 'Ngoài Sàn';
      } else {
        orderObj[key] = val;
      }
    });

    if (hasData && orderObj.ma_phieugui) {
      parsedOrders.push(orderObj as Order);
    } else if (hasData) {
      errors.push(`Dòng ${i + 1}: Bỏ qua do thiếu Mã phiếu gửi.`);
    }
  }

  return { orders: parsedOrders, errors };
}
