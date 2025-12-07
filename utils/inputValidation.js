import { z } from 'zod';

// Fungsi sanitasi input untuk mencegah XSS dan injeksi lainnya
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Hapus atau encode karakter berbahaya
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }
  return input;
};

// Fungsi validasi SQL injection untuk string input
export const validateSQLInjection = (input) => {
  if (typeof input !== 'string') return true;
  
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|UNION\s+ALL)\b)/gi,
    /(;?\s*(DROP|EXEC|EXECUTE|CALL)\s+)/gi,
    /(\b(OR|AND)\s+[\w\s]*[=<>][\s\d\w]*\s*\b(OR|AND)\b)/gi,
    /(\/\*.*\*\/)/gi,  // Comment patterns
    /(\-\-.*$)/gm  // Comment patterns
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(input)) {
      return false;
    }
  }
  return true;
};

// Schema umum untuk validasi ID
export const idSchema = z
  .string()
  .min(1, { message: 'ID harus disediakan' })
  .refine(validateSQLInjection, { message: 'Format ID tidak valid' });

// Schema untuk validasi string umum
export const stringSchema = z
  .string()
  .min(1, { message: 'Nilai wajib diisi' })
  .max(255, { message: 'Nilai terlalu panjang' })
  .refine(validateSQLInjection, { message: 'Input mengandung karakter berbahaya' });

// Schema untuk validasi username
export const usernameSchema = z
  .string()
  .min(3, { message: 'Username minimal 3 karakter' })
  .max(50, { message: 'Username maksimal 50 karakter' })
  .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username hanya boleh mengandung huruf, angka, dan underscore' })
  .refine(validateSQLInjection, { message: 'Username mengandung karakter berbahaya' });

// Schema untuk validasi email
export const emailSchema = z
  .string()
  .min(1, { message: 'Email wajib diisi' })
  .max(255, { message: 'Email terlalu panjang' })
  .email({ message: 'Format email tidak valid' })
  .refine(validateSQLInjection, { message: 'Email mengandung karakter berbahaya' });

// Schema untuk validasi angka
export const numberSchema = z
  .preprocess((val) => typeof val === 'string' ? parseInt(val) : val, 
    z.number({ 
      required_error: 'Nilai wajib diisi', 
      invalid_type_error: 'Harus berupa angka' 
    })
    .int({ message: 'Harus berupa bilangan bulat' })
    .min(0, { message: 'Nilai tidak boleh negatif' })
  );

// Validasi filter untuk mencegah SQL injection pada query parameter
export const validateFilterParams = (params) => {
  const forbiddenValues = [';', '--', '/*', '*/', 'xp_', 'sp_', 'sys'];
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      
      // Cek karakter dan pola berbahaya
      if (!validateSQLInjection(value)) {
        return { valid: false, error: `Parameter ${key} mengandung karakter SQL yang berbahaya` };
      }

      // Cek nilai-nilai yang dilarang
      for (const forbidden of forbiddenValues) {
        if (lowerValue.includes(forbidden)) {
          return { valid: false, error: `Parameter ${key} mengandung nilai yang dilarang: ${forbidden}` };
        }
      }
    }
  }
  
  return { valid: true };
};

// Fungsi untuk membersihkan dan memvalidasi parameter query
export const sanitizeQueryParams = (searchParams) => {
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    if (typeof value === 'string' && value.length > 0) {
      // Validasi SQL injection
      if (!validateSQLInjection(value)) {
        throw new Error(`Parameter query '${key}' mengandung karakter berbahaya`);
      }
      
      // Sanitasi input
      params[key] = sanitizeInput(value);
    }
  }
  return params;
};

// Validasi input untuk filter produk
export const validateProductFilters = (params) => {
  const { valid, error } = validateFilterParams(params);
  if (!valid) {
    throw new Error(error);
  }
  
  // Validasi spesifik untuk filter produk
  const {
    page, limit, search, category, supplier, 
    productCode, minStock, maxStock, minPrice, maxPrice
  } = params;

  // Validasi tipe data untuk filter numerik
  if (page && isNaN(parseInt(page)) && parseInt(page) < 1) {
    throw new Error('Parameter page harus berupa angka positif');
  }
  
  if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    throw new Error('Parameter limit harus berupa angka antara 1-100');
  }
  
  if (minStock && isNaN(parseInt(minStock))) {
    throw new Error('Parameter minStock harus berupa angka');
  }
  
  if (maxStock && isNaN(parseInt(maxStock))) {
    throw new Error('Parameter maxStock harus berupa angka');
  }
  
  if (minPrice && isNaN(parseInt(minPrice))) {
    throw new Error('Parameter minPrice harus berupa angka');
  }
  
  if (maxPrice && isNaN(parseInt(maxPrice))) {
    throw new Error('Parameter maxPrice harus berupa angka');
  }

  // Jika semua validasi lolos
  return true;
};

// Validasi untuk body request
export const validateRequestBody = (body, schema) => {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0].message;
      throw new Error(errorMessage);
    }
    throw new Error('Validasi input gagal');
  }
};