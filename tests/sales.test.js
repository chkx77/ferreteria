import test from 'node:test';
import assert from 'node:assert/strict';
import { groupItems, remainingStock, saleTotals } from '../src/lib/sales.js';
test('acumula líneas duplicadas antes de validar existencias', () => {
  const lines = groupItems([{id:'a',cantidad:2}, {id:'a',cantidad:3}]);
  assert.equal(lines[0].cantidad, 5);
  assert.throws(() => remainingStock({stock:4}, lines[0].cantidad), /insuficiente/);
});
test('rechaza venta con stock cero o cantidades negativas', () => {
  assert.throws(() => remainingStock({stock:0}, 1));
  assert.throws(() => groupItems([{id:'a',cantidad:-1}]));
});
test('calcula descuento e IVA con redondeo monetario', () => {
  assert.deepEqual(saleTotals([{precio:100,cantidad:2}], 10), {subtotal:200,descuento:20,iva:37.8,total:217.8});
  assert.throws(() => saleTotals([{precio:10,cantidad:1}], 101));
  assert.throws(() => saleTotals([{precio:-10,cantidad:1}], 0));
});
