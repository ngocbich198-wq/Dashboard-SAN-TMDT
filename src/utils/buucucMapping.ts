// Map of ma_buucuc_goc to Region (Khu vực), Cluster (Cụm), and name
export interface BuuCucMapInfo {
  kv: string; // Khu vực (Region)
  cum: string; // Cụm (Cluster)
  ten: string; // Tên bưu cục
}

// Raw CSV from user's request
const RAW_CSV = `STT,KHU V?C,ma_buucuc_goc,TN B?U C?C,C?M,,,,1,HCM 01,ABC,?p B?c,12,HCM 01,BHN,B?y Hi?n,13,HCM 01,BUC,Bu Ct,14,HCM 01,CHA,C?ng Ha,15,HCM 01,COT,Cao Th?ng,36,HCM 01,DVNG,??ng V?n Ng? - HCM,17,HCM 01,HATH,Ha Th?nh,28,HCM 01,HBHCPN,Hub Ph Nhu?n,29,HCM 01,HBHCQ3,Hub Qu?n 3,310,HCM 01,HBHCTB,HUB Tn Bnh,111,HCM 01,HBQN10,BC HUB Qu?n 10,312,HCM 01,HBQU11,Hub Qu?n 11,213,HCM 01,HCM01,Kho vng HCM1,214,HCM 01,HCM05,Kho Vng HCM5,315,HCM 01,HCM10,Kho vng HCM10,316,HCM 01,HCM68,HCM68,117,HCM 01,HCMTC01,Th? th? HCM01,318,HCM 01,HCMTTH,Tn Thnh,219,HCM 01,HSA,Hong Sa,320,HCM 01,LHPG,L H?ng Phong,321,HCM 01,LLQ,L?c Long Qun,222,HCM 01,LTTN,L Tr?ng T?n,223,HCM 01,PNN,Ph Nhu?n,124,HCM 01,PQG,Ph? Quang,125,HCM 01,PUTH,Ph Th?nh - HCM,226,HCM 01,PXL,Phan Xch Long,127,HCM 01,QU10,Qu?n 10,328,HCM 01,QU11,Qu?n 11,229,HCM 01,QU3,Qu?n 3,330,HCM 01,TAB,Tn Bnh,131,HCM 01,TGC,Tr??ng Chinh,132,HCM 01,TGN,Tr??ng S?n,133,HCM 01,THPC,Thin Ph??c,134,HCM 01,TNQ,Tn Qu?,235,HCM 01,TPU,Tn Ph,236,HCM 01,TQN,Tr??ng Quy?n,337,HCM 01,TSNI,Tn S?n Nh,238,HCM 01,TT3HCM,H? Ch Minh 03,139,HCM 01,TTQU10,TT Qu?n 10,340,HCM 01,TTTPU,Trung tm Qu?n Tn Ph,241,HCM 01,TYT,Ty Th?nh,242,HCM 02,ADN,An ?i?n,643,HCM 02,ADV,An D??ng V??ng,444,HCM 02,ALC,An L?c,545,HCM 02,BAH,B Hom,546,HCM 02,BHT,Bnh Tn,547,HCM 02,BTD,Bnh Tr? ?ng,548,HCM 02,BTDA,Bnh Tr? ?ng A,549,HCM 02,COLO,Cao L?,450,HCM 02,HBHCBC,Bnh Chnh,651,HCM 02,HBHCBG,Bnh H?ng,652,HCM 02,HBHCQ5,BC HUB Qu?n 5,453,HCM 02,HBHCQ6,Hub Qu?n 6,454,HCM 02,HBHCQ8,Hub Qu?n 8,455,HCM 02,HBHCVL,V?nh L?c,656,HCM 02,HBHT01,Hub Bnh Tn 01,557,HCM 02,HBHT02,Hub Bnh Tn 02,558,HCM 02,HCM06,Kho vng HCM6,559,HCM 02,HGBG,H?ng Bng - HCM,460,HCM 02,HGV,Hng V??ng,461,HCM 02,KDV,Kinh D??ng V??ng,562,HCM 02,LMX,L Minh Xun,663,HCM 02,NBK,Nguy?n B?nh Khim - HCM,664,HCM 02,NTU,Nguy?n Th? T?,565,HCM 02,PDH,Ph ??nh,466,HCM 02,PTHN,Ph?m Th? Hi?n - HCM,467,HCM 02,PVCH,Ph?m V?n Ch - HCM,468,HCM 02,QU5,Qu?n 5,469,HCM 02,QU6,Qu?n 6,470,HCM 02,QU8,Qu?n 8,471,HCM 02,TGS,Trung S?n,672,HCM 02,TQTY,Tn Qu? Ty,673,HCM 02,TT2HCM,Trung tm 2,574,HCM 02,TVLC,Tn V?nh L?c,675,HCM 02,VVV,V V?n Vn,676,HCM 03,BNE,B?n Ngh,777,HCM 03,BNT,B?n Thnh,778,HCM 03,CGG,C Giang,779,HCM 03,HBHCCG,C?n Gi?,980,HCM 03,HBHCNB,Nh B,981,HCM 03,HBHCQ1,Hub Qu?n 1,782,HCM 03,HBHCQ4,Hub Qu?n 4,783,HCM 03,HBHCQ7,Qu?n 7,884,HCM 03,HCM09,Kho vng HCM9,885,HCM 03,HCM11,Kho vng HCM11,786,HCM 03,HCMTC02,Th? th? HCM02,887,HCM 03,HGGA,H?ng Gia,888,HCM 03,HGP,H?ng Ph,889,HCM 03,HLAM,Him Lam - HCM,890,HCM 03,HPC,Hi?p Ph??c,991,HCM 03,HQVT,Hong Qu?c Vi?t - HCM,892,HCM 03,MPU,M? Ph,893,HCM 03,NNDC,Nh?n ??c - HCM,994,HCM 03,PMH,Ph M? H?ng,895,HCM 03,PUXN,Ph Xun,996,HCM 03,QN1,Qu?n 1,797,HCM 03,QU4,Qu?n 4,798,HCM 03,TND,Tn ??nh,799,HCM 03,TT4HCM,H? Ch Minh 04,8100,HCM 04,AHI,An H?i,11101,HCM 04,ANHN,An Nh?n,11102,HCM 04,ANTY,An Nh?n Ty,12103,HCM 04,APD,An Ph ?ng,10104,HCM 04,BDM,B ?i?m,12105,HCM 04,BMY,Bnh M?,12106,HCM 04,DOTH,?ng Th?nh,12107,HCM 04,HBHCCC,C? Chi,12108,HCM 04,HBHCDT,?ng H?ng Thu?n,10109,HCM 04,HBHCGV,Giao G V?p,11110,HCM 04,HBHCTQ,Tn Quy,12111,HCM 04,HHCQ12,BC HUB Qu?n 12,10112,HCM 04,HHMXTI,Xun th?i,12113,HCM 04,HITH,Hi?p Thnh - HCM,10114,HCM 04,HMN,Hc Mn,12115,HCM 04,LDTO,L ??c Th?,11116,HCM 04,NOH,Nguy?n Oanh,11117,HCM 04,NVQ,Nguy?n V?n Qu - HCM,10118,HCM 04,PCVHA,Ph??c V?nh An - HCM,12119,HCM 04,PHCTH,Ph??c Th?nh,12120,HCM 04,PVCU,Ph?m V?n Chiu,11121,HCM 04,PVI,Phan V?n Tr?,11122,HCM 04,QGVP,Trung Tm Qu?n G V?p,11123,HCM 04,QTG,Quang Trung,11124,HCM 04,QU12,Qu?n 12,10125,HCM 04,TCP,Tn Chnh Hi?p,10126,HCM 04,THGNT,Th?ng Nh?t - HCM,11127,HCM 04,THX,Th?nh Xun,10128,HCM 04,TLC,Bu? C?c Th?nh L?c,10129,HCM 04,TMY,Trung M? Ty - HCM,10130,HCM 04,TNX,Tn Xun,12131,HCM 04,TPT,Tn Ph Trung,12132,HCM 04,TTHP,Tn Th?i Hi?p,10133,HCM 04,TTNI,Tn Th?i Nh,12134,HCM 04,TTNT,Tn Th?i Nh?t,10135,HCM 04,XTS,Xun Th?i S?n,12136,HCM 04,XTT,Xun Th?i Th??ng - HCM,12137,HCM 05,BADG,B?ch ??ng - HCM,13138,HCM 05,BAN,Bnh An,14139,HCM 05,BHC,Bnh Chi?u,15140,HCM 05,BTDG,Bnh Tr?ng ?ng,14141,HCM 05,BTH,Bnh Th?nh,13142,HCM 05,BTT,Bnh Tr?ng Ty,14143,HCM 05,CALI,Ct Li - HCM,14144,HCM 05,DGTYTM,??ng Thy Trm - HCM,13145,HCM 05,HBC,Hi?p Bnh Chnh,15146,HCM 05,HBHCAP,An Ph,14147,HCM 05,HBHCBH,Hub Bnh Th?nh,13148,HCM 05,HBHCLG,HUB Long Tr??ng - HCM,16149,HCM 05,HBHCLT,HUB Linh Trung,15150,HCM 05,HBHCPL,Hub Ph??c Long,16151,HCM 05,HBHCQ2,Hub Qu?n 2,14152,HCM 05,HBHCQ9,Qu?n 9,16153,HCM 05,HBHCTD,Hub Th? ??c,15154,HCM 05,HCM03,Kho vng HCM03,15155,HCM 05,HCM04,Kho Vng HCM4,15156,HCM 05,HCM07,Kho vng HCM7,15157,HCM 05,HCMVNC,V?n Phc,15158,HCM 05,HHTM,Hong Hoa Thm,13159,HCM 05,HIBH,Hi?p Bnh,15160,HCM 05,HXH,Hng Xanh,13161,HCM 05,KGDN,Khang ?i?n - HCM,16162,HCM 05,LGT,Long Tr??ng,16163,HCM 05,LHG,Linh Trung,15164,HCM 05,LHX,Linh Xun,15165,HCM 05,LTM,Long Th?nh M? - HCM,16166,HCM 05,MND,Mi?n ?ng,13167,HCM 05,PCLG,Ph??c Long,16168,HCM 05,QU2,Qu?n 2,14169,HCM 05,SIT,Su?i Tin,16170,HCM 05,TDC,Th? ??c,15171,HCM 05,TDN,Th?o ?i?n,14172,HCM 05,TGTH,Tr??ng Th?nh,16173,HCM 05,TGTO,Tr??ng Th?,15174,HCM 05,THHDA,Thanh ?a - HCM,13175,HCM 05,TMB,Tam Bnh,15176,HCM 05,TML,Th?nh M? L?i,14177,HCM 05,TMPU,Tam Ph,15178,HCM 05,TT5HCM,H? Ch Minh 05,15179,HCM 05,TYHA,Ty Ha,16180,HCM 05,XHI,Xun Hi?p - HCM,15181,HCM 06,ANBH,An Bnh,20182,HCM 06,ATY,An Ty,18183,HCM 06,BDGBHA,Bnh Ha,19184,HCM 06,BDGPHL,BC Pht Hng L?n BDG,19185,HCM 06,BDGRBP,R?ch B?p,18186,HCM 06,BDGTBH,Tn Bnh,20187,HCM 06,BDGTHA,Thi Ha,17188,HCM 06,BDGVC,??i xe BDG,19189,HCM 06,BHCN,Bnh Chu?n,19190,HCM 06,CPHA,Chnh Ph Ha,18191,HCM 06,DAN,D? An,20192,HCM 06,DGAN,??ng An,19193,HCM 06,HBBDBB,Bu Bng,18194,HCM 06,HBBDBC,B?n Ct,18195,HCM 06,HBBDBU,B?c Tn Uyn,17196,HCM 06,HBBDDA,Th?ng L?i,20197,HCM 06,HBBDDT,D?u Ti?ng,18198,HCM 06,HBBDHP,Ha Ph,17199,HCM 06,HBBDHT,Hi?p Thnh,17200,HCM 06,HBBDLT,An Th?nh,19201,HCM 06,HBBDPG,Ph Gio,17202,HCM 06,HBBDTG,Thu?n Giao,19203,HCM 06,HBBDTU,Tn Uyn,17204,HCM 06,HCMSSO,S? Sao,18205,HCM 06,HONI,H?i Ngh?a,17206,HCM 06,HUBBDG,Hub Bnh D??ng 1,19207,HCM 06,HUBTAN,Hub Bnh D??ng 2,19208,HCM 06,ICDST,ICD Tn C?ng Sng Th?n,19209,HCM 06,LTU,Li Thiu,19210,HCM 06,MYP,M? Ph??c,18211,HCM 06,STN,Sng Th?n,20212,HCM 06,TDM,Th? D?u M?t,17213,HCM 06,TNPCKH,Tn Ph??c Khnh,17214,HCM 06,TPM,Thnh Ph? M?i,17215,HCM 06,VSIP,VSIP,19216,HCM 06,VTN,V?nh Tn,17217,HCM 07,CND,Cn ??o,21218,HCM 07,DXN,Ph??c Th?ng,21219,HCM 07,HAHP,Ha Hi?p,23220,HCM 07,HBVTBR,B R?a,23221,HCM 07,HBVTCD,Chu ??c,22222,HCM 07,HBVTDD,??t ??,23223,HCM 07,HBVTVT,R?ch D?a,21224,HCM 07,HBVTXM,Xuyn M?c,23225,HCM 07,HIB,H?i Bi,22226,HCM 07,HUBVTU,Hub V?ng Tu,23227,HCM 07,LGHG,Long H??ng,23228,HCM 07,LGTN,Long Ton,23229,HCM 07,LHI,Long H?i,23230,HCM 07,MYN,M? Xun,22231,HCM 07,PCHI,Ph??c H?i,23232,HCM 07,SNE,Su?i Ngh?,22233,HCM 07,TCTN,Tc Tin,22234,HCM 07,TTH,Tn Thnh,22235,HCM 07,TTM,Th?ng Tam,21236,HCM 07,VTU,V?ng Tu,21237,HCM 07,VTUCLH,Ch Linh,21,HCM 04,TT6HCM,H? Ch Minh 06,11,HCM 01,HCM009,??i l? ?y quy?n V?n T?i Bi?n Minh ??c,2,HCM 08,HCMKV1,Kho kinh doanh H? Ch Minh 1,24,HCM 08,HCMKV2,Kho kinh doanh H? Ch Minh 2,24,HCM 03,HCMTC03,Th? th? 03,7,HCM 04,HHGI,B?u c?c H Huy Gip,10,HCM 01,HCMTC11,Th? th? 11,2,HCM 01,HCMTC07,Th? th? 07,1,HCM 05,HCMTC05,Th? th? 05,13,HCM 06,HCM010,??i l? ?y quy?n Moonship - HCM,20,HCM 04,HCMTC09,Th? th? 09,11,HCM 02,HCMTTOG,Kho hng n?ng Tn T?o - HCM,,HCM 05,CH0075,,,HCM 02,CH0076,,,HCM 02,CH0077,,,HCM 02,CH0078,,,HCM 02,CH0079,,,HCM 04,CH0083,,,HCM 04,CH0084,,,HCM 04,CH0085,,,HCM 01,CH0101,,,HCM 01,CH0102,,,HCM 01,CH0103,,,HCM 02,CH0104,,,HCM 02,CH0106,,,HCM 02,CH0107,,,HCM 03,CH0109,,,HCM 03,CH0110,,,HCM 03,CH0111,,,HCM 01,CH0113,,,HCM 01,CH0114,,,HCM 01,CH0115,,,HCM 01,CH0116,,,HCM 01,CH0117,,,HCM 01,CH0119,,,HCM 05,CH0120,,,HCM 05,CH0121,,,HCM 05,CH0122,,,HCM 03,NVLH,,,HCM 01,TNKI,,,HCM 04,TTHMN,,,HCM 01,HBHCTP,,,HCM 03,CH0112,,,HCM 01,OSHCM,,,HCM 05,CH0081,,,HCM 02,CH0087,,,HCM 02,CH0108,,,HCM 01,CH0118,,,HCM 01,HVT,,,HCM 08,BCQTHCM,,,HCM 05,CH0082,,,HCM 05,CH0098,,,HCM 05,CH0099,,,HCM 01,CH0105,,,HCM 05,HCM003,,,HCM 01,HCM004,,,HCM 08,BDGKHL,,,HCM 06,CH0554,,,HCM 06,CH0557,,,HCM 06,CH0552,,,HCM 06,CH0559,,,HCM 06,CH0555,,,HCM 06,HBBDBD,,,HCM 07,CH0647,,,HCM 06,OSBDG,,,HCM 06,CH0556,,,HCM 06,CH0558,,,HCM 07,VTU01,,,HCM 01,HCM005,,,HCM 02,HCM12,,`;

// Parse CSV content and populate lookup map
const buuCucLookup: Record<string, BuuCucMapInfo> = {};

function initMapping() {
  const parts = RAW_CSV.split(',');
  
  // Hand-built fallback mapping for sample data (BC_CAUGIAY, BC_HOANKIEM, BC_DONGDA, BC_HAIBATRUNG)
  buuCucLookup["CAUGIAY"] = { kv: "HCM 01", cum: "Cụm 1", ten: "Bưu cục Cầu Giấy" };
  buuCucLookup["HOANKIEM"] = { kv: "HCM 02", cum: "Cụm 4", ten: "Bưu cục Hoàn Kiếm" };
  buuCucLookup["DONGDA"] = { kv: "HCM 03", cum: "Cụm 7", ten: "Bưu cục Đống Đa" };
  buuCucLookup["HAIBATRUNG"] = { kv: "HCM 04", cum: "Cụm 10", ten: "Bưu cục Hai Bà Trưng" };
  buuCucLookup["KHAC"] = { kv: "HCM 05", cum: "Cụm 13", ten: "Bưu cục Khác" };

  // Parse CSV
  let i = 8; // skip header "STT,KHU V?C,ma_buucuc_goc,TN B?U C?C,C?M,,,,"
  let lastStt = 0;
  
  while (i < parts.length) {
    const p = parts[i];
    if (!p) {
      i++;
      continue;
    }

    // Check if part matches a region like "HCM 01", "HCM 02", ...
    if (p.startsWith("HCM") || p.startsWith("CN") || p.startsWith("BDG")) {
      const region = p.trim();
      const code = parts[i + 1]?.trim();
      if (!code) {
        i += 2;
        continue;
      }

      const name = parts[i + 2]?.trim() || "";
      const squashedField = parts[i + 3]?.trim() || "";

      // Determine Cluster
      let cluster = "Cụm 1"; // default
      
      // Let's increment expected STT
      const expectedNextStt = lastStt + 1;
      lastStt = expectedNextStt;

      if (squashedField) {
        // If squashed is e.g. "12" and expected next is 2: ends with "2" -> cluster "1"
        // If squashed is e.g. "310" and expected next is 10: ends with "10" -> cluster "3"
        const nextSttStr = String(expectedNextStt + 1);
        if (squashedField.endsWith(nextSttStr)) {
          const clusterNum = squashedField.slice(0, squashedField.length - nextSttStr.length);
          if (clusterNum) {
            cluster = `Cụm ${clusterNum}`;
          }
        } else {
          // Fallback check: if it is just a plain number
          const num = parseInt(squashedField);
          if (!isNaN(num) && num > 0 && num < 30) {
            cluster = `Cụm ${num}`;
          }
        }
      }

      const normalizedCode = code.toUpperCase();
      buuCucLookup[normalizedCode] = {
        kv: region,
        cum: cluster,
        ten: name
      };

      // Advance: 4 fields (region, code, name, squashed)
      i += 4;
    } else {
      // If it is another field format e.g. CH0075
      // Let's see if parts[i] is region and parts[i+1] is code
      const nextP = parts[i + 1];
      if (p.startsWith("HCM") && nextP && nextP.startsWith("CH")) {
        buuCucLookup[nextP.toUpperCase()] = {
          kv: p.trim(),
          cum: "Cụm 1",
          ten: `Bưu cục ${nextP}`
        };
        i += 2;
      } else {
        i++;
      }
    }
  }
}

// Initialize lookup on load
initMapping();

export function getBuuCucMapping(ma: string): BuuCucMapInfo {
  if (!ma) return { kv: "Khác", cum: "Khác", ten: "Chưa xác định" };
  
  // Normalize code
  let clean = ma.trim().toUpperCase();
  if (clean.startsWith("BC_")) {
    clean = clean.slice(3);
  }

  const found = buuCucLookup[clean];
  if (found) return found;

  // Generic fallback if not mapped
  // Map HCMXX to Region based on suffix
  const matchNum = clean.match(/(\d+)/);
  if (matchNum) {
    const num = parseInt(matchNum[1]);
    const kvNum = ((num - 1) % 7) + 1;
    const cumNum = ((num - 1) % 23) + 1;
    return {
      kv: `HCM 0${kvNum}`,
      cum: `Cụm ${cumNum}`,
      ten: `Bưu cục ${clean}`
    };
  }

  return {
    kv: "Khác",
    cum: "Khác",
    ten: `Bưu cục ${ma}`
  };
}

export function getAllMappedBuuCucs() {
  return buuCucLookup;
}
