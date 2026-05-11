'use client';

/**
 * PrintMedicationList — Componente print-only que genera una "Lista de
 * medicamentos" en formato papel (A4) pensada para que el adulto mayor
 * lleve al médico o farmacéutico. Visible solo durante `window.print()`
 * vía clase `body.printing-med-list` en globals.css.
 *
 * Incluye: encabezado farmacia + fecha, datos paciente (auto-rellenos
 * si hay sesión, o líneas en blanco para llenar a mano), tabla de
 * medicamentos con principio activo, posología orientativa (drug-info),
 * dosis e indicaciones (espacios para escribir), interacciones detectadas,
 * y disclaimer legal.
 */

import { useMemo } from 'react';
import type { CartItem } from '@/lib/api';
import { lookupDrugInfo, prettifyDrugName } from '@/lib/drug-info';
import { checkInteractions } from '@/lib/drug-interactions';
import { checkDuplicates } from '@/lib/drug-duplicates';

export default function PrintMedicationList({
  items,
  patientName,
  patientEmail,
}: {
  items: CartItem[];
  patientName?: string | null;
  patientEmail?: string | null;
}) {
  const today = useMemo(
    () =>
      new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const interactions = useMemo(
    () => checkInteractions(items.map((i) => i.active_ingredient)),
    [items],
  );

  const duplicates = useMemo(() => checkDuplicates(items), [items]);

  return (
    <div id="print-med-list" className="print-only">
      <header className="med-header">
        <div>
          <h1>Tu Farmacia</h1>
          <p className="muted">
            Coquimbo, Chile · tu-farmacia.cl · WhatsApp +56 9 9364 9604
          </p>
        </div>
        <div className="med-date">
          <p className="muted">Fecha</p>
          <p className="med-date-value">{today}</p>
        </div>
      </header>

      <h2 className="med-title">Lista de medicamentos</h2>
      <p className="med-subtitle">
        Documento referencial para presentar a su médico o farmacéutico.
      </p>

      <section className="med-patient">
        <div className="med-field">
          <span className="med-label">Paciente:</span>
          <span className="med-value">{patientName || ''}</span>
        </div>
        <div className="med-field">
          <span className="med-label">RUT:</span>
          <span className="med-value"></span>
        </div>
        <div className="med-field">
          <span className="med-label">Edad:</span>
          <span className="med-value"></span>
        </div>
        <div className="med-field med-field-wide">
          <span className="med-label">Email:</span>
          <span className="med-value">{patientEmail || ''}</span>
        </div>
        <div className="med-field med-field-wide">
          <span className="med-label">Médico tratante:</span>
          <span className="med-value"></span>
        </div>
        <div className="med-field med-field-wide">
          <span className="med-label">Diagnóstico / motivo:</span>
          <span className="med-value"></span>
        </div>
      </section>

      <table className="med-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Medicamento</th>
            <th>Principio activo</th>
            <th>Posología orientativa</th>
            <th>Cantidad</th>
            <th>Dosis indicada por médico</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const lookup = lookupDrugInfo(item.active_ingredient);
            const posologia = lookup.length > 0 ? lookup[0].info.posologia : '';
            const ingredientPretty = lookup.length > 0
              ? lookup.map((r) => prettifyDrugName(r.name)).join(', ')
              : item.active_ingredient || '—';
            return (
              <tr key={item.product_id}>
                <td>{idx + 1}</td>
                <td className="med-product">{item.product_name}</td>
                <td>{ingredientPretty}</td>
                <td className="med-posologia">{posologia || '—'}</td>
                <td className="med-qty">{item.quantity}</td>
                <td className="med-blank"></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {duplicates.length > 0 && (
        <section className="med-duplicates">
          <h3>Principios activos duplicados</h3>
          <p className="muted">
            Productos con el mismo principio activo. Riesgo de doble dosis — confirme con su médico antes de combinarlos.
          </p>
          <ul>
            {duplicates.map((g) => (
              <li key={g.drug}>
                <strong>{g.prettyDrug}</strong> ({g.items.length} productos)
                <ul className="med-dup-items">
                  {g.items.map((it) => (
                    <li key={it.product_id}>
                      {it.product_name}
                      {it.quantity > 1 ? ` × ${it.quantity}` : ''}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {interactions.length > 0 && (
        <section className="med-interactions">
          <h3>Interacciones medicamentosas detectadas</h3>
          <p className="muted">
            La combinación de los productos listados podría producir las siguientes interacciones.
            Verifique con su médico antes de iniciar el tratamiento.
          </p>
          <ul>
            {interactions.map((it, i) => (
              <li key={i}>
                <strong>
                  {prettifyDrugName(it.drugs[0])} + {prettifyDrugName(it.drugs[1])}
                </strong>
                <span className={`med-sev med-sev-${it.severity}`}>
                  {it.severity === 'critica' ? 'Crítica' : it.severity === 'mayor' ? 'Mayor' : 'Moderada'}
                </span>
                <br />
                <span className="med-eff"><em>Efecto:</em> {it.effect}</span>
                <br />
                <span className="med-rec"><em>Recomendación:</em> {it.recommendation}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="med-notes">
        <h3>Notas del médico / farmacéutico</h3>
        <div className="med-blank-lines">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </section>

      <footer className="med-footer">
        <div>
          <p className="muted">Firma médico</p>
          <div className="med-sign-line"></div>
        </div>
        <div>
          <p className="muted">Firma paciente</p>
          <div className="med-sign-line"></div>
        </div>
      </footer>

      <p className="med-disclaimer">
        Documento generado por Tu Farmacia. Las posologías orientativas provienen del
        Formulario Nacional de Medicamentos (ISP Chile) y Vademécum Chileno. Esta lista
        no constituye prescripción médica. Siga siempre las indicaciones de su médico tratante.
      </p>
    </div>
  );
}
