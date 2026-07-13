export function formatResult(result, action = 'getAll') {
  if (!result) {
    return {
      success: false,
      message: 'Data tidak ditemukan',
      data: null
    };
  }

  if (action === 'getAll') {
    const data = Array.isArray(result) ? result : [result];
    return {
      success: true,
      message: 'Data berhasil diambil',
      count: data.length,
      data: data
    };
  }

  if (action === 'getOne') {
    return {
      success: true,
      message: 'Data berhasil diambil',
      data: result
    };
  }

  return {
    success: true,
    message: 'Operasi berhasil',
    data: result
  };
}