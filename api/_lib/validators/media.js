function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function validateProduct(input) {
  const p = input && typeof input === 'object' ? input : {};

  const nome = p.nome;
  const imagemUrl = p.imagemUrl;
  const resumo = p.resumo;
  const anoLancamento = p.anoLancamento;

  if (!isNonEmptyString(nome)) {
    return { ok: false, error: 'Field "nome" is required' };
  }

  if (!isNonEmptyString(imagemUrl)) {
    return { ok: false, error: 'Field "imagemUrl" is required' };
  }

  if (anoLancamento !== undefined && typeof anoLancamento !== 'number') {
    return { ok: false, error: 'Field "anoLancamento" must be a number' };
  }

  return {
    ok: true,
    value: {
      nome: nome.trim(),
      imagemUrl: imagemUrl.trim(),
      ...(typeof resumo === 'string' ? { resumo } : {}),
      ...(anoLancamento !== undefined ? { anoLancamento } : {}),
    },
  };
}

module.exports = { validateProduct };