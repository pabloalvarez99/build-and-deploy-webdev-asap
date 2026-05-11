/**
 * lib/drug-info.ts — Información farmacéutica profesional por principio activo.
 *
 * Base de conocimientos curada para mostrar información tipo prospecto en
 * páginas de producto. Lookup por `active_ingredient` normalizado.
 *
 * Fuente: Formulario Nacional de Medicamentos (ISP Chile), Vademécum Chileno,
 * Beers Criteria (cautelas adulto mayor), prospectos oficiales.
 *
 * NO sustituye al criterio médico. La UI muestra disclaimer obligatorio.
 */

export interface DrugInfo {
  /** Composición/categoría farmacológica breve */
  categoria: string;
  /** Indicaciones terapéuticas principales */
  indicaciones: string;
  /** Posología orientativa (dosis adulto). Siempre seguir indicación médica. */
  posologia: string;
  /** Efectos adversos más frecuentes y graves a vigilar */
  efectos_adversos: string;
  /** Contraindicaciones absolutas y relativas */
  contraindicaciones: string;
  /** Precauciones específicas para adulto mayor (≥65 años) */
  precauciones_adulto_mayor: string;
  /** Interacciones medicamentosas relevantes */
  interacciones: string;
  /** Conservación */
  conservacion?: string;
}

/**
 * KB de principios activos. Clave: nombre canónico en MAYÚSCULAS sin tildes ni dosis.
 * Cubre los principios activos más comunes en farmacia ambulatoria chilena.
 */
export const DRUG_INFO: Record<string, DrugInfo> = {
  PARACETAMOL: {
    categoria: 'Analgésico y antipirético no opioide.',
    indicaciones: 'Dolor leve a moderado (cefalea, dolor dental, musculoesquelético, dismenorrea) y fiebre.',
    posologia: 'Adultos: 500–1000 mg cada 6–8 horas. Máximo 4 g al día. En adultos mayores o bajo peso, no superar 3 g/día.',
    efectos_adversos: 'Bien tolerado a dosis terapéuticas. A dosis altas o prolongadas: daño hepático (riesgo aumentado con alcohol o ayuno). Rash cutáneo raro.',
    contraindicaciones: 'Hipersensibilidad al paracetamol. Insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'Es el analgésico de primera elección en adulto mayor por buen perfil de seguridad. Reducir dosis máxima a 3 g/día si hay bajo peso, desnutrición o consumo regular de alcohol. Vigilar uso simultáneo de productos para resfrío que también contengan paracetamol.',
    interacciones: 'Warfarina (puede aumentar INR con uso prolongado). Alcohol (mayor riesgo hepatotóxico). Inductores hepáticos (rifampicina, fenitoína, carbamazepina).',
    conservacion: 'Temperatura ambiente, bajo 30 °C, protegido de la humedad.',
  },

  IBUPROFENO: {
    categoria: 'Antiinflamatorio no esteroidal (AINE), derivado del ácido propiónico.',
    indicaciones: 'Dolor leve a moderado, fiebre, inflamación (artritis, esguinces, dismenorrea, cefalea).',
    posologia: 'Adultos: 200–400 mg cada 6–8 horas. Máximo 1200 mg/día sin receta, hasta 2400 mg/día con indicación médica. Tomar con alimentos.',
    efectos_adversos: 'Molestias gástricas, acidez, náuseas. Riesgo de úlcera y sangrado digestivo. Retención de líquidos, alza de presión arterial. Daño renal con uso prolongado o deshidratación.',
    contraindicaciones: 'Úlcera péptica activa, sangrado gastrointestinal previo, insuficiencia cardíaca grave, insuficiencia renal o hepática severa, embarazo (3er trimestre), alergia a AINES.',
    precauciones_adulto_mayor: 'EVITAR uso crónico en mayores de 65 años (criterios Beers): alto riesgo de úlcera, sangrado digestivo, falla renal y descompensación de hipertensión o insuficiencia cardíaca. Si es necesario, usar dosis mínima por el menor tiempo posible y considerar protector gástrico (omeprazol). Preferir paracetamol como primera opción.',
    interacciones: 'Anticoagulantes (warfarina, rivaroxabán) y antiplaquetarios (aspirina, clopidogrel): mayor riesgo de sangrado. IECA/ARA II y diuréticos: reducen efecto antihipertensivo y aumentan riesgo renal. Litio, metotrexato: aumentan toxicidad. Corticoides: mayor riesgo gástrico.',
    conservacion: 'Temperatura ambiente, bajo 30 °C.',
  },

  DICLOFENACO: {
    categoria: 'Antiinflamatorio no esteroidal (AINE).',
    indicaciones: 'Dolor e inflamación en artrosis, artritis, dolor postoperatorio, lumbago, cólicos, dismenorrea.',
    posologia: 'Adultos: 50 mg 2–3 veces al día, o 75 mg cada 12 h. Máximo 150 mg/día. Tomar con alimentos.',
    efectos_adversos: 'Gastritis, úlcera, sangrado digestivo. Aumento de presión arterial, retención de líquidos. Mayor riesgo cardiovascular (infarto, ACV) que otros AINEs. Daño renal y hepático.',
    contraindicaciones: 'Úlcera activa, sangrado digestivo, insuficiencia cardíaca, cardiopatía isquémica, ACV previo, insuficiencia renal o hepática severa, embarazo (3er trimestre).',
    precauciones_adulto_mayor: 'EVITAR en adulto mayor por alto riesgo cardiovascular, gástrico y renal (criterios Beers). Si es indispensable, dosis mínima y duración corta, con protector gástrico. La presentación tópica (gel) es preferible para dolor localizado.',
    interacciones: 'Igual que ibuprofeno: anticoagulantes, IECA/ARA II, diuréticos, litio, metotrexato, corticoides.',
    conservacion: 'Temperatura ambiente, protegido de la luz.',
  },

  KETOPROFENO: {
    categoria: 'Antiinflamatorio no esteroidal (AINE).',
    indicaciones: 'Dolor e inflamación musculoesquelética, artrosis, artritis reumatoide, dismenorrea.',
    posologia: 'Adultos: 50 mg cada 6–8 h o 100 mg cada 12 h. Máximo 200 mg/día. Tomar con alimentos.',
    efectos_adversos: 'Gastritis, úlcera, sangrado digestivo. Cefalea, mareos. Fotosensibilidad cutánea (la presentación en gel puede causar reacciones con exposición solar).',
    contraindicaciones: 'Úlcera activa, alergia a AINES, insuficiencia renal o hepática severa, embarazo (3er trimestre).',
    precauciones_adulto_mayor: 'Mismas cautelas que otros AINEs en adulto mayor: evitar uso crónico, considerar paracetamol o gel tópico. Vigilar función renal.',
    interacciones: 'Anticoagulantes, IECA/ARA II, diuréticos, litio, metotrexato.',
    conservacion: 'Temperatura ambiente.',
  },

  KETOROLACO: {
    categoria: 'Antiinflamatorio no esteroidal (AINE) potente.',
    indicaciones: 'Dolor moderado a severo de corta duración (postoperatorio, cólico renal). Uso máximo 5 días.',
    posologia: 'Adultos: 10 mg cada 4–6 horas. Máximo 40 mg/día. No exceder 5 días de tratamiento.',
    efectos_adversos: 'Alto riesgo de sangrado digestivo y falla renal aguda. Náuseas, mareo, somnolencia.',
    contraindicaciones: 'Insuficiencia renal, deshidratación, úlcera, riesgo de sangrado, embarazo, lactancia.',
    precauciones_adulto_mayor: 'EVITAR en adulto mayor por alto riesgo renal y digestivo. Si se usa, reducir dosis a la mitad y limitar a 2–3 días. No combinar con otros AINEs.',
    interacciones: 'Anticoagulantes (riesgo de sangrado severo), IECA, diuréticos, litio, metotrexato.',
    conservacion: 'Temperatura ambiente.',
  },

  METAMIZOL: {
    categoria: 'Analgésico no opioide, antipirético, espasmolítico (dipirona).',
    indicaciones: 'Dolor moderado a severo, especialmente cólicos viscerales (renal, biliar). Fiebre refractaria.',
    posologia: 'Adultos: 500–1000 mg cada 6–8 horas vía oral. Máximo 4 g/día.',
    efectos_adversos: 'Hipotensión (especialmente vía endovenosa). Reacciones alérgicas. Raramente, pero grave: agranulocitosis (caída de glóbulos blancos) — consulte si aparece fiebre, dolor de garganta o úlceras en boca.',
    contraindicaciones: 'Alergia a pirazolonas, déficit de G6PD, embarazo (1er y 3er trimestre), antecedente de agranulocitosis.',
    precauciones_adulto_mayor: 'Útil cuando paracetamol es insuficiente y los AINEs están contraindicados. Vigilar presión arterial. Suspender ante cualquier signo de infección (fiebre, malestar).',
    interacciones: 'Anticoagulantes (potencia efecto), clorpromazina (hipotermia severa), ciclosporina (reduce niveles).',
    conservacion: 'Temperatura ambiente.',
  },

  'ACIDO ACETILSALICILICO': {
    categoria: 'AINE y antiagregante plaquetario (aspirina).',
    indicaciones: 'Dosis bajas (75–100 mg/día): prevención cardiovascular (post-infarto, post-ACV). Dosis altas: dolor, fiebre, inflamación.',
    posologia: 'Cardioprotección: 75–100 mg/día. Analgesia: 500–1000 mg cada 4–6 h (máx 4 g/día). Tomar con alimentos.',
    efectos_adversos: 'Gastritis, úlcera, sangrado digestivo (incluso con dosis bajas). Tinnitus a dosis altas. Reacciones alérgicas. Síndrome de Reye en niños (no usar bajo 16 años).',
    contraindicaciones: 'Úlcera activa, hemofilia, alergia a salicilatos, embarazo (3er trimestre), niños con cuadros virales.',
    precauciones_adulto_mayor: 'A dosis cardiovasculares (100 mg) el balance riesgo/beneficio se evalúa individualmente: mayor riesgo de sangrado digestivo y cerebral con la edad. Considerar protector gástrico. Suspender 7 días antes de cirugía electiva si lo indica el médico.',
    interacciones: 'Anticoagulantes (riesgo de sangrado grave). Otros AINEs. Metotrexato. IECA/ARA II y diuréticos (reducen efecto).',
    conservacion: 'Temperatura ambiente, en envase original cerrado (sensible a humedad).',
  },

  NAPROXENO: {
    categoria: 'AINE de vida media larga.',
    indicaciones: 'Dolor e inflamación crónica (artrosis, artritis), dismenorrea, dolor agudo musculoesquelético.',
    posologia: 'Adultos: 250–500 mg cada 12 h. Máximo 1000 mg/día. Con alimentos.',
    efectos_adversos: 'Gastritis, úlcera, sangrado digestivo. Mareos, retención de líquidos. Tiene mejor perfil cardiovascular que otros AINEs.',
    contraindicaciones: 'Úlcera activa, insuficiencia renal o hepática severa, alergia a AINEs.',
    precauciones_adulto_mayor: 'Si se requiere un AINE oral crónico en adulto mayor, es preferible a diclofenaco o ibuprofeno por menor riesgo cardiovascular. Aún así, usar dosis mínima eficaz y considerar protector gástrico.',
    interacciones: 'Anticoagulantes, IECA, diuréticos, litio, metotrexato.',
    conservacion: 'Temperatura ambiente.',
  },

  MELOXICAM: {
    categoria: 'AINE preferencial COX-2.',
    indicaciones: 'Artrosis, artritis reumatoide, espondilitis anquilosante.',
    posologia: 'Adultos: 7,5–15 mg una vez al día. Tomar con alimentos.',
    efectos_adversos: 'Menos gastrolesivo que AINEs clásicos, pero igual riesgo cardiovascular y renal. Cefalea, edema.',
    contraindicaciones: 'Úlcera activa, insuficiencia cardíaca grave, alergia a AINEs.',
    precauciones_adulto_mayor: 'Iniciar con 7,5 mg/día. Vigilar función renal y presión arterial.',
    interacciones: 'Anticoagulantes, IECA, diuréticos, litio.',
    conservacion: 'Temperatura ambiente.',
  },

  ETORICOXIB: {
    categoria: 'AINE inhibidor selectivo COX-2.',
    indicaciones: 'Artrosis, artritis reumatoide, gota aguda, dolor postoperatorio.',
    posologia: 'Adultos: 60–90 mg una vez al día (artrosis/artritis); 120 mg/día por máximo 8 días (gota aguda).',
    efectos_adversos: 'Hipertensión, edema. Menor riesgo gástrico que AINEs clásicos. Riesgo cardiovascular aumentado (infarto, ACV).',
    contraindicaciones: 'Hipertensión no controlada, insuficiencia cardíaca, cardiopatía isquémica, ACV previo, insuficiencia renal o hepática severa.',
    precauciones_adulto_mayor: 'Vigilar estrechamente la presión arterial. Evitar si hay enfermedad cardiovascular establecida.',
    interacciones: 'IECA/ARA II, diuréticos, anticoagulantes, litio.',
    conservacion: 'Temperatura ambiente.',
  },

  CELECOXIB: {
    categoria: 'AINE inhibidor selectivo COX-2.',
    indicaciones: 'Artrosis, artritis reumatoide, dolor agudo.',
    posologia: 'Adultos: 100–200 mg cada 12 h. Máximo 400 mg/día.',
    efectos_adversos: 'Menor riesgo gástrico, pero mantiene riesgo cardiovascular y renal. Edema, hipertensión.',
    contraindicaciones: 'Cardiopatía isquémica, ACV, alergia a sulfas, insuficiencia cardíaca grave.',
    precauciones_adulto_mayor: 'Buena alternativa cuando se requiere AINE crónico y hay riesgo gástrico, pero precaución cardiovascular.',
    interacciones: 'Warfarina (aumenta INR), IECA, diuréticos.',
    conservacion: 'Temperatura ambiente.',
  },

  AMOXICILINA: {
    categoria: 'Antibiótico betalactámico (penicilina de amplio espectro).',
    indicaciones: 'Infecciones respiratorias (otitis, sinusitis, neumonía), urinarias, dentales, cutáneas. Erradicación de H. pylori (en combinación).',
    posologia: 'Adultos: 500 mg cada 8 h o 875 mg cada 12 h, por 7–10 días. Cumplir tratamiento completo aunque mejoren los síntomas.',
    efectos_adversos: 'Diarrea, náuseas, rash cutáneo. Candidiasis. Raramente: colitis pseudomembranosa, anafilaxia.',
    contraindicaciones: 'Alergia a penicilinas o cefalosporinas. Mononucleosis (rash frecuente).',
    precauciones_adulto_mayor: 'Ajustar dosis si hay insuficiencia renal (frecuente en adulto mayor). Vigilar hidratación si hay diarrea.',
    interacciones: 'Anticonceptivos orales (puede reducir eficacia — usar método de respaldo). Alopurinol (aumenta rash). Metotrexato (aumenta toxicidad).',
    conservacion: 'Cápsulas: temperatura ambiente. Suspensión reconstituida: refrigerar y desechar a los 7–14 días.',
  },

  'AMOXICILINA + ACIDO CLAVULANICO': {
    categoria: 'Antibiótico betalactámico combinado con inhibidor de betalactamasas.',
    indicaciones: 'Infecciones por bacterias resistentes a amoxicilina sola: sinusitis recurrente, otitis, infecciones dentales, mordeduras, infecciones urinarias complicadas.',
    posologia: 'Adultos: 500/125 mg cada 8 h o 875/125 mg cada 12 h. Tomar al inicio de las comidas para reducir molestias gástricas.',
    efectos_adversos: 'Diarrea (más frecuente que amoxicilina sola), náuseas, candidiasis. Riesgo de hepatitis colestásica (poco frecuente).',
    contraindicaciones: 'Alergia a penicilinas. Antecedente de hepatitis por amoxiclav.',
    precauciones_adulto_mayor: 'Mayor riesgo de diarrea y hepatitis colestásica. Ajustar dosis en insuficiencia renal.',
    interacciones: 'Anticoagulantes (puede potenciar warfarina), anticonceptivos orales, alopurinol.',
    conservacion: 'Suspensión: refrigerar, usar dentro de 7 días.',
  },

  AZITROMICINA: {
    categoria: 'Antibiótico macrólido de vida media larga.',
    indicaciones: 'Infecciones respiratorias (faringitis, bronquitis, neumonía atípica), de piel, urogenitales (clamidia).',
    posologia: 'Adultos: 500 mg el día 1, luego 250 mg/día por 4 días (total 5 días). Tomar con o sin alimentos.',
    efectos_adversos: 'Diarrea, náuseas, dolor abdominal. Prolongación del intervalo QT (riesgo de arritmias).',
    contraindicaciones: 'Alergia a macrólidos, historia de prolongación QT, insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'Riesgo elevado de arritmias por QT prolongado, especialmente si toma otros fármacos que prolongan QT, tiene cardiopatía o desequilibrio electrolítico. Solicitar ECG si hay dudas.',
    interacciones: 'Antiarrítmicos, antipsicóticos (haloperidol, risperidona), antidepresivos (citalopram, escitalopram), warfarina, digoxina.',
    conservacion: 'Temperatura ambiente.',
  },

  CIPROFLOXACINO: {
    categoria: 'Antibiótico fluoroquinolona de amplio espectro.',
    indicaciones: 'Infecciones urinarias complicadas, prostatitis, infecciones gastrointestinales bacterianas, respiratorias seleccionadas.',
    posologia: 'Adultos: 250–750 mg cada 12 h, según indicación. Tomar con abundante agua, separado de antiácidos y lácteos al menos 2 horas.',
    efectos_adversos: 'Tendinitis y ruptura tendinosa (especialmente tendón de Aquiles), neuropatía periférica, alteraciones psiquiátricas, prolongación QT, diarrea por C. difficile, fotosensibilidad. Hipoglucemia o hiperglucemia.',
    contraindicaciones: 'Antecedente de tendinitis por quinolonas, embarazo, lactancia, menores de 18 años.',
    precauciones_adulto_mayor: 'ALTO RIESGO en adulto mayor: tendinopatía (más aún si toma corticoides), confusión, arritmias, hipoglucemia (si toma antidiabéticos). Reservar para infecciones donde no hay alternativa. Suspender ante cualquier dolor tendinoso.',
    interacciones: 'Antiácidos, hierro, calcio, lácteos (reducen absorción). Warfarina (aumenta INR). Teofilina, tizanidina (toxicidad). Antidiabéticos (hipo/hiperglucemia). Corticoides (riesgo tendinoso).',
    conservacion: 'Temperatura ambiente.',
  },

  METRONIDAZOL: {
    categoria: 'Antibiótico/antiprotozoario nitroimidazol.',
    indicaciones: 'Infecciones por anaerobios, vaginosis bacteriana, tricomoniasis, amebiasis, giardiasis, H. pylori, colitis por C. difficile.',
    posologia: 'Adultos: 500 mg cada 8 h por 7–10 días, o según indicación. Tomar con alimentos.',
    efectos_adversos: 'Sabor metálico, náuseas, cefalea. Orina oscura (inocua). Neuropatía con uso prolongado.',
    contraindicaciones: '1er trimestre embarazo, alergia. Consumo de alcohol (reacción tipo disulfiram).',
    precauciones_adulto_mayor: 'NO consumir alcohol durante el tratamiento y hasta 48 h después. Vigilar neuropatía si el tratamiento se prolonga.',
    interacciones: 'Alcohol (efecto disulfiram: náuseas, taquicardia, hipotensión). Warfarina (aumenta INR). Litio (toxicidad).',
    conservacion: 'Temperatura ambiente.',
  },

  CLOTRIMAZOL: {
    categoria: 'Antifúngico imidazólico tópico.',
    indicaciones: 'Candidiasis cutánea, vulvovaginal, oral. Tiña corporis, pedis, cruris. Pitiriasis versicolor.',
    posologia: 'Crema/loción: aplicar 2–3 veces al día por 2–4 semanas. Óvulos vaginales: según presentación, generalmente 1 al día por 6 días.',
    efectos_adversos: 'Irritación local, ardor, enrojecimiento. Raramente reacciones alérgicas.',
    contraindicaciones: 'Hipersensibilidad al clotrimazol.',
    precauciones_adulto_mayor: 'Seguro tópicamente. En micosis recurrente vaginal o cutánea, descartar diabetes mal controlada.',
    interacciones: 'No relevantes por vía tópica.',
    conservacion: 'Temperatura ambiente.',
  },

  KETOCONAZOL: {
    categoria: 'Antifúngico imidazólico.',
    indicaciones: 'Tópico: dermatitis seborreica, caspa, pitiriasis versicolor, micosis cutáneas. Shampoo: caspa fúngica.',
    posologia: 'Shampoo: 2 veces por semana, dejar 3–5 min antes de enjuagar, por 2–4 semanas. Crema: 1–2 veces al día.',
    efectos_adversos: 'Irritación local, prurito, cambios en textura del cabello (shampoo).',
    contraindicaciones: 'Hipersensibilidad. Vía oral está restringida por hepatotoxicidad.',
    precauciones_adulto_mayor: 'La presentación oral está prácticamente en desuso por riesgo hepático. Tópico es seguro.',
    interacciones: 'No relevantes por vía tópica.',
    conservacion: 'Temperatura ambiente.',
  },

  TERBINAFINA: {
    categoria: 'Antifúngico alilamina.',
    indicaciones: 'Onicomicosis (hongos en uñas), tiña del cuero cabelludo, tiña corporal extensa. Tópico para micosis cutáneas.',
    posologia: 'Oral: 250 mg/día por 6 semanas (uñas manos) a 12 semanas (uñas pies). Tópico: 1–2 veces al día por 1–2 semanas.',
    efectos_adversos: 'Oral: alteración del gusto (puede durar semanas), molestias gástricas, rash, hepatotoxicidad (poco frecuente pero seria). Tópico: irritación local.',
    contraindicaciones: 'Insuficiencia hepática, insuficiencia renal severa.',
    precauciones_adulto_mayor: 'Solicitar pruebas hepáticas antes y durante el tratamiento oral. Suspender ante ictericia, orina oscura o dolor abdominal.',
    interacciones: 'Inhibe CYP2D6: precaución con betabloqueantes, antidepresivos tricíclicos, ISRS.',
    conservacion: 'Temperatura ambiente.',
  },

  FLUCONAZOL: {
    categoria: 'Antifúngico triazol.',
    indicaciones: 'Candidiasis vulvovaginal, oral, esofágica, sistémica. Onicomicosis. Profilaxis en inmunodeprimidos.',
    posologia: 'Candidiasis vaginal: dosis única de 150 mg. Otras indicaciones: 100–400 mg/día.',
    efectos_adversos: 'Cefalea, náuseas, dolor abdominal. Hepatotoxicidad. Prolongación QT.',
    contraindicaciones: 'Embarazo (en lo posible), uso simultáneo con fármacos que prolonguen QT.',
    precauciones_adulto_mayor: 'Vigilar interacciones (afecta muchos CYP). Ajustar dosis en insuficiencia renal.',
    interacciones: 'Warfarina, fenitoína, sulfonilureas, estatinas (riesgo de miopatía), benzodiazepinas, amiodarona.',
    conservacion: 'Temperatura ambiente.',
  },

  ACICLOVIR: {
    categoria: 'Antiviral análogo de nucleósido.',
    indicaciones: 'Herpes simple (oral, genital), herpes zóster (culebrilla), varicela.',
    posologia: 'Herpes labial: 400 mg 5 veces al día por 5 días, o crema 5 veces al día. Herpes zóster: 800 mg 5 veces al día por 7 días.',
    efectos_adversos: 'Náuseas, cefalea, mareo. Daño renal (especialmente si hay deshidratación o dosis altas). Confusión en adulto mayor.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Mantener buena hidratación. Ajustar dosis en insuficiencia renal. Riesgo de confusión y alucinaciones, especialmente con función renal disminuida.',
    interacciones: 'Probenecid (aumenta niveles), otros nefrotóxicos.',
    conservacion: 'Temperatura ambiente.',
  },

  LOSARTAN: {
    categoria: 'Antihipertensivo. Antagonista del receptor de angiotensina II (ARA II).',
    indicaciones: 'Hipertensión arterial, nefropatía diabética, insuficiencia cardíaca.',
    posologia: 'Adultos: inicio 50 mg/día, mantener 50–100 mg/día. Una sola toma diaria.',
    efectos_adversos: 'Mareos, hipotensión (especialmente al inicio o con diuréticos). Hiperkalemia. Tos seca menos frecuente que con IECA. Insuficiencia renal en deshidratados.',
    contraindicaciones: 'Embarazo, estenosis bilateral de arterias renales, hiperkalemia.',
    precauciones_adulto_mayor: 'Iniciar con 25 mg/día y titular. Vigilar presión arterial sentado y de pie (riesgo de hipotensión ortostática y caídas). Controlar potasio y creatinina a las 2 semanas y luego periódicamente.',
    interacciones: 'AINEs (reducen efecto, aumentan riesgo renal). Diuréticos ahorradores de potasio, suplementos de potasio (hiperkalemia). Litio (toxicidad).',
    conservacion: 'Temperatura ambiente.',
  },

  ENALAPRIL: {
    categoria: 'Antihipertensivo. Inhibidor de la enzima convertidora de angiotensina (IECA).',
    indicaciones: 'Hipertensión, insuficiencia cardíaca, nefropatía diabética, post-infarto.',
    posologia: 'Adultos: inicio 5–10 mg/día, mantener 10–40 mg/día (1–2 tomas).',
    efectos_adversos: 'Tos seca persistente (10–15%), hipotensión, mareo, hiperkalemia, falla renal, angioedema (raro pero grave).',
    contraindicaciones: 'Embarazo, antecedente de angioedema, estenosis renal bilateral.',
    precauciones_adulto_mayor: 'Iniciar con dosis baja (2,5–5 mg). Vigilar caídas por hipotensión ortostática. Controlar creatinina y potasio. Suspender ante tos persistente o hinchazón facial/lingual.',
    interacciones: 'AINEs, diuréticos ahorradores de potasio, litio, alopurinol.',
    conservacion: 'Temperatura ambiente.',
  },

  ATENOLOL: {
    categoria: 'Betabloqueante cardioselectivo (β1).',
    indicaciones: 'Hipertensión, angina, post-infarto, arritmias supraventriculares.',
    posologia: 'Adultos: 25–100 mg/día en una toma.',
    efectos_adversos: 'Bradicardia, fatiga, frialdad de extremidades, broncoespasmo, disfunción eréctil, depresión, enmascaramiento de hipoglucemia en diabéticos.',
    contraindicaciones: 'Bradicardia severa, bloqueo AV 2°–3° grado, asma, insuficiencia cardíaca descompensada, hipotensión.',
    precauciones_adulto_mayor: 'No se considera primera línea como antihipertensivo en mayores. Si se usa, iniciar 25 mg/día. NO suspender bruscamente (riesgo de angina/infarto de rebote): reducir gradualmente. Vigilar frecuencia cardíaca (no bajar de 50 lpm).',
    interacciones: 'Verapamilo, diltiazem (bradicardia severa). Antidiabéticos (enmascara hipoglucemia). Clonidina (no suspender ambos a la vez).',
    conservacion: 'Temperatura ambiente.',
  },

  CARVEDILOL: {
    categoria: 'Betabloqueante no selectivo con efecto alfa-bloqueante.',
    indicaciones: 'Insuficiencia cardíaca crónica, hipertensión, post-infarto.',
    posologia: 'Adultos: inicio 3,125 mg cada 12 h, titulación gradual hasta 25 mg cada 12 h. Tomar con alimentos.',
    efectos_adversos: 'Mareo, hipotensión ortostática (sobre todo al inicio o al subir dosis), bradicardia, fatiga, edema.',
    contraindicaciones: 'Asma, bloqueo AV avanzado, insuficiencia cardíaca descompensada aguda, hipotensión severa.',
    precauciones_adulto_mayor: 'Titular muy lentamente. Alto riesgo de caídas por hipotensión. Tomar con alimentos reduce hipotensión. No suspender bruscamente.',
    interacciones: 'Verapamilo, diltiazem, antidiabéticos, digoxina, amiodarona.',
    conservacion: 'Temperatura ambiente.',
  },

  AMLODIPINO: {
    categoria: 'Antihipertensivo. Antagonista de canales de calcio (dihidropiridina).',
    indicaciones: 'Hipertensión arterial, angina estable y vasoespástica.',
    posologia: 'Adultos: inicio 2,5–5 mg/día, mantener 5–10 mg/día. Una toma diaria.',
    efectos_adversos: 'Edema de tobillos (frecuente, dosis-dependiente), rubor, cefalea, palpitaciones, hiperplasia gingival.',
    contraindicaciones: 'Hipotensión severa, shock cardiogénico, estenosis aórtica severa.',
    precauciones_adulto_mayor: 'Buen perfil en adulto mayor. Iniciar con 2,5 mg. Vigilar edema de extremidades inferiores (no responde a diuréticos: se maneja reduciendo dosis o cambiando fármaco).',
    interacciones: 'Simvastatina (limitar a 20 mg). Inhibidores CYP3A4 (claritromicina, antifúngicos azoles): aumentan niveles.',
    conservacion: 'Temperatura ambiente.',
  },

  HIDROCLOROTIAZIDA: {
    categoria: 'Diurético tiazídico.',
    indicaciones: 'Hipertensión arterial, edema leve, prevención de cálculos renales por hipercalciuria.',
    posologia: 'Adultos: 12,5–25 mg/día en la mañana.',
    efectos_adversos: 'Hipokalemia, hiponatremia, hiperuricemia (gota), hiperglucemia, hipotensión ortostática, fotosensibilidad, disfunción eréctil.',
    contraindicaciones: 'Anuria, alergia a sulfas, hiponatremia o hipokalemia severas.',
    precauciones_adulto_mayor: 'Frecuente hiponatremia en mayores: vigilar sodio sérico, especialmente en las primeras semanas. Riesgo de caídas por hipotensión. Tomar en la mañana para evitar nicturia.',
    interacciones: 'Litio (toxicidad), AINEs (reducen efecto), digoxina (toxicidad por hipokalemia).',
    conservacion: 'Temperatura ambiente.',
  },

  BISOPROLOL: {
    categoria: 'Betabloqueante cardioselectivo (β1).',
    indicaciones: 'Hipertensión, angina, insuficiencia cardíaca crónica.',
    posologia: 'Adultos: 2,5–10 mg/día en una toma matinal.',
    efectos_adversos: 'Bradicardia, fatiga, mareo, frialdad de extremidades, broncoespasmo (menor que no selectivos).',
    contraindicaciones: 'Bradicardia severa, bloqueo AV 2°–3°, asma severa, insuficiencia cardíaca aguda.',
    precauciones_adulto_mayor: 'Buen perfil. Iniciar con 1,25–2,5 mg. No suspender bruscamente.',
    interacciones: 'Verapamilo, diltiazem, clonidina, antidiabéticos.',
    conservacion: 'Temperatura ambiente.',
  },

  PROPRANOLOL: {
    categoria: 'Betabloqueante no selectivo.',
    indicaciones: 'Hipertensión, angina, profilaxis de migraña, temblor esencial, ansiedad por escenario, hipertiroidismo (sintomático).',
    posologia: 'Adultos: 40–160 mg/día divididos en 2–3 tomas. Liberación prolongada: 80–160 mg/día.',
    efectos_adversos: 'Bradicardia, broncoespasmo, fatiga, mareo, hipoglucemia enmascarada, pesadillas.',
    contraindicaciones: 'Asma, EPOC, bloqueo AV, insuficiencia cardíaca descompensada.',
    precauciones_adulto_mayor: 'Mayor riesgo de broncoespasmo. Preferir betabloqueantes cardioselectivos. No suspender bruscamente.',
    interacciones: 'Verapamilo, diltiazem, antidiabéticos, anestésicos.',
    conservacion: 'Temperatura ambiente.',
  },

  ATORVASTATINA: {
    categoria: 'Hipolipemiante. Inhibidor de HMG-CoA reductasa (estatina).',
    indicaciones: 'Hipercolesterolemia, prevención cardiovascular primaria y secundaria.',
    posologia: 'Adultos: 10–80 mg/día, una sola toma (cualquier hora del día).',
    efectos_adversos: 'Mialgias (dolores musculares), elevación de transaminasas, alteraciones digestivas. Raramente: rabdomiólisis (dolor muscular severo + orina oscura — emergencia). Riesgo leve de diabetes de novo.',
    contraindicaciones: 'Embarazo, lactancia, hepatopatía activa.',
    precauciones_adulto_mayor: 'Es la estatina de elección por interacciones menos críticas. Vigilar dolores musculares (suspender y consultar si son intensos o con debilidad). Control de perfil hepático antes de iniciar y según evolución. Reportar orina oscura inmediatamente.',
    interacciones: 'Claritromicina, eritromicina, antifúngicos azoles, ciclosporina, gemfibrozilo: aumentan riesgo de miopatía. Jugo de pomelo en grandes cantidades.',
    conservacion: 'Temperatura ambiente.',
  },

  SIMVASTATINA: {
    categoria: 'Hipolipemiante. Estatina.',
    indicaciones: 'Hipercolesterolemia, prevención cardiovascular.',
    posologia: 'Adultos: 10–40 mg/día en la noche. NO usar dosis de 80 mg por mayor riesgo de miopatía.',
    efectos_adversos: 'Mialgias, alteración hepática, dispepsia. Mayor riesgo de miopatía que atorvastatina.',
    contraindicaciones: 'Embarazo, hepatopatía activa, uso con inhibidores potentes CYP3A4.',
    precauciones_adulto_mayor: 'Limitar dosis a 20 mg/día si se combina con amlodipino o amiodarona. Reportar dolores musculares.',
    interacciones: 'Amlodipino (máx 20 mg simvastatina), amiodarona, diltiazem, claritromicina, azoles, jugo de pomelo.',
    conservacion: 'Temperatura ambiente.',
  },

  GEMFIBROZILO: {
    categoria: 'Hipolipemiante. Fibrato.',
    indicaciones: 'Hipertrigliceridemia severa, dislipidemia mixta.',
    posologia: 'Adultos: 600 mg cada 12 h, 30 min antes del desayuno y de la cena.',
    efectos_adversos: 'Molestias gastrointestinales, mialgias, litiasis biliar, alteración hepática.',
    contraindicaciones: 'Insuficiencia hepática o renal severa, enfermedad biliar.',
    precauciones_adulto_mayor: 'NO combinar con estatinas (alto riesgo de rabdomiólisis). Si requiere combinación con estatina, preferir fenofibrato.',
    interacciones: 'Estatinas (rabdomiólisis), warfarina (potencia INR), sulfonilureas.',
    conservacion: 'Temperatura ambiente.',
  },

  METFORMINA: {
    categoria: 'Antidiabético oral. Biguanida.',
    indicaciones: 'Diabetes mellitus tipo 2 (primera línea), síndrome de ovario poliquístico, prediabetes en casos seleccionados.',
    posologia: 'Adultos: inicio 500 mg con la comida principal, titulando hasta 850–1000 mg cada 12 h. Máximo 2550 mg/día. Tomar con alimentos para reducir molestias gástricas.',
    efectos_adversos: 'Diarrea, náuseas, sabor metálico (suelen ceder con el tiempo o con presentación XR). Déficit de vitamina B12 con uso prolongado. Raramente acidosis láctica (en falla renal/hepática severa).',
    contraindicaciones: 'Insuficiencia renal severa (eGFR <30), acidosis metabólica, insuficiencia hepática severa, deshidratación.',
    precauciones_adulto_mayor: 'Es el antidiabético de elección en adulto mayor por bajo riesgo de hipoglucemia. Vigilar función renal (no usar si eGFR <30, reducir dosis si 30–45). Suspender 48 h antes de cirugías o contrastes yodados. Considerar suplemento de B12 con uso prolongado.',
    interacciones: 'Contrastes yodados (acidosis láctica), alcohol (acidosis láctica), diuréticos, IECA.',
    conservacion: 'Temperatura ambiente.',
  },

  'METFORMINA + VILDAGLIPTINA': {
    categoria: 'Combinación: biguanida + inhibidor DPP-4.',
    indicaciones: 'Diabetes mellitus tipo 2 cuando metformina sola es insuficiente.',
    posologia: 'Adultos: 50/850 mg o 50/1000 mg, una tableta cada 12 h, con las comidas.',
    efectos_adversos: 'Suman los de cada componente: gastrointestinales (metformina) + nasofaringitis, cefalea, riesgo bajo de pancreatitis (vildagliptina).',
    contraindicaciones: 'Insuficiencia renal (eGFR <50 para algunas presentaciones), insuficiencia hepática, antecedente de pancreatitis.',
    precauciones_adulto_mayor: 'Bajo riesgo de hipoglucemia. Control de pruebas hepáticas antes de iniciar y periódicamente. Suspender ante dolor abdominal intenso (sospecha de pancreatitis).',
    interacciones: 'Similares a metformina sola. Vildagliptina tiene pocas interacciones.',
    conservacion: 'Temperatura ambiente.',
  },

  EMPAGLIFLOZINA: {
    categoria: 'Antidiabético oral. Inhibidor del cotransportador sodio-glucosa 2 (SGLT2).',
    indicaciones: 'Diabetes tipo 2, insuficiencia cardíaca, enfermedad renal crónica diabética.',
    posologia: 'Adultos: 10–25 mg/día por la mañana.',
    efectos_adversos: 'Infecciones genitales micóticas (frecuentes), infecciones urinarias, deshidratación, hipotensión, raramente cetoacidosis euglucémica.',
    contraindicaciones: 'Diabetes tipo 1, cetoacidosis, insuficiencia renal severa.',
    precauciones_adulto_mayor: 'Mantener hidratación adecuada. Mayor riesgo de hipotensión y caídas. Suspender ante infección severa, deshidratación, cirugía o ayuno prolongado.',
    interacciones: 'Diuréticos (deshidratación), insulina y sulfonilureas (ajustar para evitar hipoglucemia).',
    conservacion: 'Temperatura ambiente.',
  },

  LEVOTIROXINA: {
    categoria: 'Hormona tiroidea sintética (T4).',
    indicaciones: 'Hipotiroidismo de cualquier causa, bocio, supresión post-tiroidectomía por cáncer.',
    posologia: 'Adultos: dosis individualizada según TSH. Habitual 50–150 mcg/día. TOMAR EN AYUNAS, 30–60 minutos antes del desayuno, con agua.',
    efectos_adversos: 'A dosis correcta: ninguno. A dosis excesivas: palpitaciones, temblor, insomnio, pérdida de peso, intolerancia al calor, osteoporosis con uso crónico.',
    contraindicaciones: 'Tirotoxicosis no tratada, infarto agudo.',
    precauciones_adulto_mayor: 'Iniciar con dosis baja (12,5–25 mcg/día) y titular lentamente para evitar precipitar angina o arritmias. Vigilar TSH cada 6–8 semanas hasta estabilizar, luego anual. Mantener marca/laboratorio constante (la biodisponibilidad varía).',
    interacciones: 'Calcio, hierro, omeprazol, antiácidos, café (todos reducen absorción — separar 4 horas). Warfarina (aumenta efecto). Diabéticos: puede aumentar requerimientos.',
    conservacion: 'Temperatura ambiente, en envase original (sensible a humedad y luz).',
  },

  OMEPRAZOL: {
    categoria: 'Inhibidor de bomba de protones (IBP).',
    indicaciones: 'Reflujo gastroesofágico, úlcera péptica, gastritis, H. pylori (en combinación), profilaxis de úlcera por AINEs.',
    posologia: 'Adultos: 20 mg/día, 30 min antes del desayuno. Casos severos: 40 mg/día.',
    efectos_adversos: 'Cefalea, diarrea, dolor abdominal. Uso prolongado (>1 año): déficit de B12, magnesio, calcio, hierro; mayor riesgo de fracturas, neumonía, infección por C. difficile, demencia (datos controversiales).',
    contraindicaciones: 'Hipersensibilidad. Cautela con clopidogrel.',
    precauciones_adulto_mayor: 'NO usar crónicamente sin indicación clara: reevaluar necesidad cada 6 meses y desescalonar si es posible. Vigilar magnesio y vitamina B12 con uso prolongado. Mayor riesgo de fracturas vertebrales y de cadera.',
    interacciones: 'Clopidogrel (reduce efecto antiplaquetario — usar pantoprazol como alternativa). Methotrexato, tacrolimus, digoxina, levotiroxina.',
    conservacion: 'Temperatura ambiente.',
  },

  ESOMEPRAZOL: {
    categoria: 'Inhibidor de bomba de protones (IBP).',
    indicaciones: 'Mismas que omeprazol. Reflujo, úlcera, esofagitis erosiva, H. pylori.',
    posologia: 'Adultos: 20–40 mg/día, 30 min antes del desayuno.',
    efectos_adversos: 'Similares a omeprazol. Cefalea, diarrea, déficit nutricional con uso crónico.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Mismas que omeprazol. Reevaluar necesidad periódicamente.',
    interacciones: 'Clopidogrel (algo menos que omeprazol), digoxina, levotiroxina, hierro, B12.',
    conservacion: 'Temperatura ambiente.',
  },

  FAMOTIDINA: {
    categoria: 'Antagonista H2 (anti-secretor gástrico).',
    indicaciones: 'Reflujo leve, úlcera, dispepsia.',
    posologia: 'Adultos: 20–40 mg cada 12 h o 40 mg en la noche.',
    efectos_adversos: 'Cefalea, mareo, diarrea. Menos efectos a largo plazo que los IBP.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Puede causar confusión en adulto mayor con falla renal: ajustar dosis. Alternativa razonable a IBP en uso ocasional.',
    interacciones: 'Antifúngicos azoles (reducen absorción de éstos), atazanavir.',
    conservacion: 'Temperatura ambiente.',
  },

  DOMPERIDONA: {
    categoria: 'Antiemético procinético antagonista dopaminérgico periférico.',
    indicaciones: 'Náuseas, vómitos, gastroparesia, dispepsia.',
    posologia: 'Adultos: 10 mg cada 8 h, 15–30 min antes de las comidas. Máximo 30 mg/día. Tratamiento corto (máximo 1 semana).',
    efectos_adversos: 'Prolongación QT (riesgo de arritmias graves), sequedad bucal, cefalea, galactorrea.',
    contraindicaciones: 'Prolongación QT, hipokalemia, uso con fármacos que prolonguen QT, insuficiencia hepática moderada-severa.',
    precauciones_adulto_mayor: 'EVITAR en adulto mayor por riesgo cardiovascular (arritmias). Si se requiere antiemético, considerar alternativas. Si se usa, limitar a la menor dosis y duración posible.',
    interacciones: 'Antiarrítmicos, macrólidos (azitromicina, claritromicina), antifúngicos azoles, citalopram.',
    conservacion: 'Temperatura ambiente.',
  },

  SALBUTAMOL: {
    categoria: 'Broncodilatador agonista β2 de acción corta.',
    indicaciones: 'Crisis de asma, EPOC, broncoespasmo agudo.',
    posologia: 'Inhalador: 1–2 puffs (100 mcg/puff) cada 4–6 h según necesidad. En crisis: 4–8 puffs con aerocámara.',
    efectos_adversos: 'Temblor fino, palpitaciones, taquicardia, cefalea, hipokalemia con uso intensivo.',
    contraindicaciones: 'Hipersensibilidad. Precaución en cardiopatía, hipertiroidismo, diabetes.',
    precauciones_adulto_mayor: 'Usar SIEMPRE con aerocámara para mejor depósito pulmonar y menos efectos sistémicos. Si requiere uso frecuente (>2 veces/semana), consultar — indica mal control del asma.',
    interacciones: 'Betabloqueantes (antagonizan el efecto, riesgo de broncoespasmo grave). Diuréticos (hipokalemia).',
    conservacion: 'Temperatura ambiente. Inhalador: no perforar ni exponer al calor.',
  },

  LORATADINA: {
    categoria: 'Antihistamínico H1 de segunda generación, no sedante.',
    indicaciones: 'Rinitis alérgica, urticaria, prurito.',
    posologia: 'Adultos: 10 mg una vez al día.',
    efectos_adversos: 'Cefalea, somnolencia leve (menos que los de primera generación), sequedad bucal.',
    contraindicaciones: 'Hipersensibilidad. Cautela en insuficiencia hepática.',
    precauciones_adulto_mayor: 'Buena opción por mínima sedación. Reducir a días alternos si hay falla hepática severa.',
    interacciones: 'Mínimas. Inhibidores CYP3A4 pueden aumentar niveles.',
    conservacion: 'Temperatura ambiente.',
  },

  CETIRIZINA: {
    categoria: 'Antihistamínico H1 de segunda generación.',
    indicaciones: 'Rinitis alérgica, urticaria crónica, prurito.',
    posologia: 'Adultos: 10 mg una vez al día, preferentemente en la noche.',
    efectos_adversos: 'Somnolencia (más que loratadina), sequedad bucal, fatiga.',
    contraindicaciones: 'Insuficiencia renal severa.',
    precauciones_adulto_mayor: 'Reducir dosis a 5 mg/día si hay falla renal. Cuidar somnolencia y riesgo de caídas.',
    interacciones: 'Alcohol y depresores del SNC (potencia sedación).',
    conservacion: 'Temperatura ambiente.',
  },

  LEVOCETIRIZINA: {
    categoria: 'Antihistamínico H1 segunda generación (isómero activo de cetirizina).',
    indicaciones: 'Rinitis alérgica, urticaria.',
    posologia: 'Adultos: 5 mg una vez al día, en la noche.',
    efectos_adversos: 'Somnolencia (menor que cetirizina), fatiga, sequedad bucal.',
    contraindicaciones: 'Insuficiencia renal severa.',
    precauciones_adulto_mayor: 'Ajustar dosis en falla renal.',
    interacciones: 'Alcohol, depresores del SNC.',
    conservacion: 'Temperatura ambiente.',
  },

  FEXOFENADINA: {
    categoria: 'Antihistamínico H1 segunda generación no sedante.',
    indicaciones: 'Rinitis alérgica estacional, urticaria crónica.',
    posologia: 'Adultos: 120–180 mg una vez al día. No tomar con jugo de fruta (reduce absorción).',
    efectos_adversos: 'Cefalea, náuseas leves. Muy baja sedación.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Excelente opción por mínima sedación y pocas interacciones.',
    interacciones: 'Antiácidos con aluminio/magnesio (reducen absorción — separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  BILASTINA: {
    categoria: 'Antihistamínico H1 de segunda generación, no sedante.',
    indicaciones: 'Rinitis alérgica, urticaria.',
    posologia: 'Adultos: 20 mg/día, 1 hora antes o 2 después de comer (los alimentos reducen absorción).',
    efectos_adversos: 'Mínimos. Cefalea leve.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Muy buen perfil, sin sedación ni interacciones cardiacas relevantes.',
    interacciones: 'Jugo de pomelo, ketoconazol, eritromicina (aumentan niveles).',
    conservacion: 'Temperatura ambiente.',
  },

  CLORFENAMINA: {
    categoria: 'Antihistamínico H1 de primera generación.',
    indicaciones: 'Rinitis, urticaria, reacciones alérgicas, en combinaciones para resfrío.',
    posologia: 'Adultos: 4 mg cada 4–6 h. Máximo 24 mg/día.',
    efectos_adversos: 'Somnolencia marcada, sequedad bucal, visión borrosa, retención urinaria, estreñimiento, taquicardia (efecto anticolinérgico).',
    contraindicaciones: 'Glaucoma de ángulo estrecho, hiperplasia prostática, retención urinaria, asma agudo.',
    precauciones_adulto_mayor: 'EVITAR en adulto mayor (criterios Beers): alto riesgo de confusión, caídas, retención urinaria, estreñimiento y sequedad. Preferir antihistamínicos de segunda generación (loratadina, cetirizina, bilastina).',
    interacciones: 'Alcohol, benzodiazepinas, opioides, otros anticolinérgicos (potencia efectos).',
    conservacion: 'Temperatura ambiente.',
  },

  PSEUDOEFEDRINA: {
    categoria: 'Descongestionante simpaticomimético sistémico.',
    indicaciones: 'Congestión nasal por resfrío, rinitis.',
    posologia: 'Adultos: 30–60 mg cada 4–6 h. Máximo 240 mg/día.',
    efectos_adversos: 'Insomnio, nerviosismo, palpitaciones, hipertensión, retención urinaria.',
    contraindicaciones: 'Hipertensión severa, cardiopatía isquémica, hipertiroidismo, glaucoma, hiperplasia prostática, uso de IMAO.',
    precauciones_adulto_mayor: 'EVITAR en adulto mayor con hipertensión o cardiopatía. Si se usa, dosis bajas y por pocos días. Preferir descongestionantes tópicos por corto tiempo.',
    interacciones: 'IMAO (crisis hipertensiva), antihipertensivos (antagoniza efecto), otros estimulantes.',
    conservacion: 'Temperatura ambiente.',
  },

  AMBROXOL: {
    categoria: 'Mucolítico/expectorante.',
    indicaciones: 'Tos productiva con secreciones espesas, bronquitis aguda y crónica.',
    posologia: 'Adultos: 30 mg cada 8 h o 60 mg cada 12 h. Tomar con abundante líquido.',
    efectos_adversos: 'Náuseas, sabor desagradable, raramente reacciones cutáneas (Stevens-Johnson).',
    contraindicaciones: 'Hipersensibilidad. Úlcera péptica (relativa).',
    precauciones_adulto_mayor: 'Ingerir abundante agua para potenciar efecto fluidificante. Vigilar reacciones cutáneas.',
    interacciones: 'Antitusivos: no combinar (acumula secreciones).',
    conservacion: 'Temperatura ambiente.',
  },

  OXOLAMINA: {
    categoria: 'Antitusivo no opioide.',
    indicaciones: 'Tos seca irritativa.',
    posologia: 'Adultos: 100 mg cada 8 h o jarabe según presentación.',
    efectos_adversos: 'Náuseas, mareo, somnolencia leve.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'No usar en tos productiva (puede retener secreciones). Útil para tos nocturna irritativa.',
    interacciones: 'Depresores del SNC (sedación).',
    conservacion: 'Temperatura ambiente.',
  },

  SILDENAFIL: {
    categoria: 'Inhibidor de la fosfodiesterasa-5 (PDE5).',
    indicaciones: 'Disfunción eréctil, hipertensión pulmonar.',
    posologia: 'Disfunción eréctil: 50 mg unos 30–60 min antes de la actividad sexual. Rango 25–100 mg. No más de una vez al día.',
    efectos_adversos: 'Cefalea, rubor facial, congestión nasal, dispepsia, alteraciones visuales (visión azulada), hipotensión. Raramente: pérdida brusca de visión o audición — emergencia.',
    contraindicaciones: 'Uso de nitratos (riesgo de hipotensión severa). Cardiopatía severa, infarto reciente, hipotensión. Insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'Iniciar con 25 mg. Vigilar interacciones con antihipertensivos (especialmente alfa-bloqueantes como tamsulosina). NO usar con nitratos bajo ninguna forma. Consultar a cardiólogo si hay cardiopatía.',
    interacciones: 'NITRATOS (absoluta), alfa-bloqueantes (hipotensión), inhibidores CYP3A4 (ketoconazol, claritromicina — reducir dosis).',
    conservacion: 'Temperatura ambiente.',
  },

  TADALAFILO: {
    categoria: 'Inhibidor PDE5 de acción prolongada.',
    indicaciones: 'Disfunción eréctil, hiperplasia prostática benigna, hipertensión pulmonar.',
    posologia: 'A demanda: 10–20 mg 30 min antes (efecto hasta 36 h). Diario: 2,5–5 mg/día.',
    efectos_adversos: 'Cefalea, rubor, dolor de espalda y muscular, dispepsia, congestión nasal.',
    contraindicaciones: 'Uso con nitratos, infarto reciente, hipotensión, cardiopatía grave.',
    precauciones_adulto_mayor: 'Similar a sildenafil. La dosis diaria baja también ayuda en HPB.',
    interacciones: 'Nitratos (absoluta), alfa-bloqueantes, inhibidores CYP3A4.',
    conservacion: 'Temperatura ambiente.',
  },

  PREGABALINA: {
    categoria: 'Antiepiléptico/neuromodulador. Análogo de GABA.',
    indicaciones: 'Dolor neuropático (neuralgia post-herpética, neuropatía diabética), fibromialgia, epilepsia parcial, trastorno de ansiedad generalizada.',
    posologia: 'Adultos: inicio 75 mg cada 12 h, titular hasta 150–300 mg cada 12 h.',
    efectos_adversos: 'Mareo, somnolencia, edema periférico, aumento de peso, visión borrosa, ataxia. Potencial de abuso.',
    contraindicaciones: 'Hipersensibilidad. Cautela en falla renal.',
    precauciones_adulto_mayor: 'ALTO riesgo de caídas y confusión. Iniciar con 25–50 mg/día y titular muy lentamente. Ajustar a función renal. NO suspender bruscamente.',
    interacciones: 'Opioides, benzodiazepinas, alcohol (depresión respiratoria, sedación severa).',
    conservacion: 'Temperatura ambiente.',
  },

  GABAPENTINA: {
    categoria: 'Antiepiléptico/neuromodulador.',
    indicaciones: 'Dolor neuropático, epilepsia parcial.',
    posologia: 'Adultos: inicio 300 mg/día, titular hasta 900–3600 mg/día en 3 tomas.',
    efectos_adversos: 'Somnolencia, mareo, edema, ataxia, aumento de peso.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Mismas que pregabalina: riesgo de caídas y confusión. Ajustar a función renal. Titular lento.',
    interacciones: 'Opioides, depresores del SNC, antiácidos (separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  QUETIAPINA: {
    categoria: 'Antipsicótico atípico.',
    indicaciones: 'Esquizofrenia, trastorno bipolar, depresión mayor (adyuvante). Uso off-label frecuente para insomnio.',
    posologia: 'Variable. Esquizofrenia/bipolar: 300–800 mg/día. Insomnio off-label: 25–50 mg en la noche.',
    efectos_adversos: 'Sedación marcada, ganancia de peso, hipotensión ortostática, alteraciones metabólicas, prolongación QT, síndrome metabólico.',
    contraindicaciones: 'Hipersensibilidad, uso con fármacos que prolonguen QT.',
    precauciones_adulto_mayor: 'EVITAR uso para insomnio o agitación en demencia (advertencia FDA por aumento de mortalidad). Si se usa para indicación psiquiátrica, dosis mínimas. Riesgo de caídas.',
    interacciones: 'Otros depresores del SNC, fármacos QT-prolongadores, inhibidores CYP3A4.',
    conservacion: 'Temperatura ambiente.',
  },

  RISPERIDONA: {
    categoria: 'Antipsicótico atípico.',
    indicaciones: 'Esquizofrenia, trastorno bipolar, agresividad asociada a autismo.',
    posologia: 'Adultos: 2–6 mg/día.',
    efectos_adversos: 'Síntomas extrapiramidales, hiperprolactinemia, sedación, hipotensión, aumento de peso.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'EVITAR en demencia (aumento de mortalidad y ACV). Iniciar con 0,25–0,5 mg si su uso es indispensable. Riesgo de parkinsonismo.',
    interacciones: 'Antihipertensivos, depresores del SNC, levodopa (antagonismo).',
    conservacion: 'Temperatura ambiente.',
  },

  SERTRALINA: {
    categoria: 'Antidepresivo. Inhibidor selectivo de la recaptación de serotonina (ISRS).',
    indicaciones: 'Depresión, ansiedad generalizada, trastorno de pánico, TOC, TEPT.',
    posologia: 'Adultos: inicio 25–50 mg/día, mantener 50–200 mg/día. Tomar en la mañana con alimentos.',
    efectos_adversos: 'Náuseas (al inicio), diarrea, insomnio o somnolencia, disfunción sexual, sudoración, temblor. Hiponatremia (sobre todo en adulto mayor).',
    contraindicaciones: 'Uso simultáneo de IMAO, alergia.',
    precauciones_adulto_mayor: 'Es el ISRS más recomendado en adulto mayor por menos interacciones. Vigilar sodio (riesgo de hiponatremia/SIADH), especialmente las primeras semanas. Reportar caídas, debilidad, confusión. Suspender gradualmente.',
    interacciones: 'IMAO, otros serotoninérgicos (síndrome serotoninérgico), AINEs y anticoagulantes (sangrado), warfarina.',
    conservacion: 'Temperatura ambiente.',
  },

  ESCITALOPRAM: {
    categoria: 'Antidepresivo ISRS.',
    indicaciones: 'Depresión, ansiedad generalizada, pánico, fobia social.',
    posologia: 'Adultos: 10–20 mg/día. Adultos mayores: máximo 10 mg/día.',
    efectos_adversos: 'Náuseas, insomnio, disfunción sexual, sudoración, hiponatremia, prolongación QT.',
    contraindicaciones: 'IMAO, prolongación QT, alergia.',
    precauciones_adulto_mayor: 'Máximo 10 mg/día por riesgo de QT. Vigilar sodio.',
    interacciones: 'IMAO, fármacos QT-prolongadores (macrólidos, antipsicóticos), AINEs.',
    conservacion: 'Temperatura ambiente.',
  },

  FLUOXETINA: {
    categoria: 'Antidepresivo ISRS de vida media larga.',
    indicaciones: 'Depresión, TOC, bulimia, trastorno disfórico premenstrual.',
    posologia: 'Adultos: 20–60 mg/día por la mañana.',
    efectos_adversos: 'Insomnio, agitación, náuseas, disfunción sexual, hiponatremia, sangrado.',
    contraindicaciones: 'IMAO (esperar 5 semanas tras suspender fluoxetina por su vida media).',
    precauciones_adulto_mayor: 'Larga vida media puede ser problema en adulto mayor (acumulación). Vigilar interacciones y sodio.',
    interacciones: 'IMAO, AINEs, anticoagulantes, tamoxifeno (reduce eficacia), tramadol (síndrome serotoninérgico).',
    conservacion: 'Temperatura ambiente.',
  },

  ALPRAZOLAM: {
    categoria: 'Benzodiazepina de vida media corta-intermedia.',
    indicaciones: 'Trastorno de pánico, ansiedad.',
    posologia: 'Adultos: 0,25–0,5 mg cada 8 h. Máximo 4 mg/día.',
    efectos_adversos: 'Sedación, ataxia, deterioro cognitivo, amnesia anterógrada, dependencia, tolerancia, depresión respiratoria con opioides.',
    contraindicaciones: 'Glaucoma agudo, insuficiencia respiratoria severa, miastenia, apnea del sueño.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): alto riesgo de caídas, fracturas, confusión, accidentes y dependencia. Si ya está en tratamiento crónico, NO suspender bruscamente — desescalar lentamente con apoyo profesional.',
    interacciones: 'Opioides (depresión respiratoria, muerte), alcohol, antidepresivos sedantes, antifúngicos azoles.',
    conservacion: 'Temperatura ambiente.',
  },

  CLONAZEPAM: {
    categoria: 'Benzodiazepina de vida media larga.',
    indicaciones: 'Epilepsia, trastorno de pánico, ansiedad.',
    posologia: 'Adultos: 0,5–2 mg/día divididos en 2–3 tomas.',
    efectos_adversos: 'Sedación, mareo, ataxia, deterioro cognitivo, depresión, dependencia.',
    contraindicaciones: 'Glaucoma agudo, miastenia, insuficiencia respiratoria.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers). Vida media muy larga: alto riesgo de acumulación y caídas. Desescalar gradualmente.',
    interacciones: 'Opioides, alcohol, otros sedantes.',
    conservacion: 'Temperatura ambiente.',
  },

  ZOPICLONA: {
    categoria: 'Hipnótico no-benzodiazepínico (Z-drug).',
    indicaciones: 'Insomnio de corta duración.',
    posologia: 'Adultos: 3,75–7,5 mg en la noche, justo antes de acostarse. Máximo 4 semanas.',
    efectos_adversos: 'Sabor metálico/amargo, somnolencia residual, ataxia, amnesia, dependencia.',
    contraindicaciones: 'Apnea severa, miastenia, insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): igual riesgo de caídas y deterioro cognitivo que benzodiazepinas. Si se usa, máximo 3,75 mg y por pocos días. Higiene del sueño debe ser primera opción.',
    interacciones: 'Alcohol, depresores SNC, opioides.',
    conservacion: 'Temperatura ambiente.',
  },

  MELATONINA: {
    categoria: 'Hormona reguladora del ritmo circadiano.',
    indicaciones: 'Insomnio (especialmente conciliación), jet lag, trastornos del sueño en mayores.',
    posologia: 'Adultos: 1–5 mg 30–60 min antes de dormir.',
    efectos_adversos: 'Somnolencia diurna, cefalea, mareo, sueños vívidos.',
    contraindicaciones: 'Hipersensibilidad. Cautela en autoinmunes y epilepsia.',
    precauciones_adulto_mayor: 'Opción preferida sobre hipnóticos en insomnio del adulto mayor. Dosis bajas (1–2 mg) suelen ser suficientes. Combinar con higiene del sueño.',
    interacciones: 'Anticoagulantes, antidiabéticos, fluvoxamina (aumenta niveles).',
    conservacion: 'Temperatura ambiente.',
  },

  TRAMADOL: {
    categoria: 'Analgésico opioide débil con efecto serotoninérgico.',
    indicaciones: 'Dolor moderado a severo.',
    posologia: 'Adultos: 50–100 mg cada 6–8 h. Máximo 400 mg/día.',
    efectos_adversos: 'Náuseas, vómitos, mareo, somnolencia, estreñimiento, sequedad bucal, convulsiones (dosis altas o predispuestos), síndrome serotoninérgico con antidepresivos, dependencia.',
    contraindicaciones: 'Epilepsia mal controlada, intoxicación aguda con alcohol u otros depresores, uso con IMAO.',
    precauciones_adulto_mayor: 'Alto riesgo de caídas, confusión, hiponatremia y náuseas. Iniciar con dosis baja (25 mg) y ampliar intervalos. Tratar profilácticamente el estreñimiento.',
    interacciones: 'ISRS, IRSN, tricíclicos, IMAO (síndrome serotoninérgico). Carbamazepina (reduce eficacia). Warfarina (potencia).',
    conservacion: 'Temperatura ambiente.',
  },

  'PARACETAMOL + TRAMADOL': {
    categoria: 'Combinación analgésica: paracetamol + opioide débil.',
    indicaciones: 'Dolor moderado a severo agudo o crónico cuando paracetamol solo es insuficiente.',
    posologia: 'Adultos: 1–2 comprimidos (325/37,5 mg cada uno) cada 6 h. Máximo 8 al día.',
    efectos_adversos: 'Náuseas, somnolencia, mareo, estreñimiento, sequedad bucal.',
    contraindicaciones: 'Igual que tramadol. Hepatopatía severa.',
    precauciones_adulto_mayor: 'Dosis baja al inicio. Vigilar caídas, estreñimiento, confusión, hiponatremia.',
    interacciones: 'Igual que tramadol: ISRS, IRSN, IMAO, alcohol.',
    conservacion: 'Temperatura ambiente.',
  },

  'VITAMINA C': {
    categoria: 'Ácido ascórbico. Vitamina hidrosoluble antioxidante.',
    indicaciones: 'Prevención y tratamiento del déficit. Apoyo inmune. Cofactor en síntesis de colágeno.',
    posologia: 'Adultos: 60–1000 mg/día. Dosis altas (>2 g) no aportan beneficio adicional y pueden causar problemas.',
    efectos_adversos: 'A dosis altas: diarrea, molestias gástricas, cálculos renales (oxalatos), interferencia en glicemia capilar.',
    contraindicaciones: 'Cálculos renales por oxalatos, hemocromatosis (aumenta absorción de hierro).',
    precauciones_adulto_mayor: 'Limitar a 500–1000 mg/día. Hidratación adecuada.',
    interacciones: 'Aumenta absorción de hierro. Puede interferir con warfarina a dosis muy altas.',
    conservacion: 'Temperatura ambiente, protegido de luz y humedad.',
  },

  'VITAMINA D3': {
    categoria: 'Colecalciferol. Vitamina liposoluble.',
    indicaciones: 'Déficit de vitamina D, prevención de osteoporosis y caídas en adulto mayor, raquitismo.',
    posologia: 'Adultos: 800–2000 UI/día (mantención). En déficit confirmado: dosis de carga según indicación médica.',
    efectos_adversos: 'A dosis correctas: ninguno. Toxicidad por sobredosis crónica: hipercalcemia, náuseas, debilidad, cálculos renales.',
    contraindicaciones: 'Hipercalcemia, hipervitaminosis D, sarcoidosis activa.',
    precauciones_adulto_mayor: 'Recomendado para prevención de osteoporosis y caídas (800–2000 UI/día). Idealmente medir niveles séricos antes de dosis altas. Combinar con calcio si la ingesta dietaria es insuficiente.',
    interacciones: 'Diuréticos tiazídicos (hipercalcemia), corticoides (reducen efecto), anticonvulsivantes (reducen efecto).',
    conservacion: 'Temperatura ambiente.',
  },

  'ACIDO FOLICO': {
    categoria: 'Vitamina B9 hidrosoluble.',
    indicaciones: 'Anemia megaloblástica por déficit, prevención de defectos del tubo neural en embarazo (preconcepcional y 1er trimestre), suplementación en hemodiálisis y con metotrexato.',
    posologia: 'Prevención: 400 mcg/día. Tratamiento de déficit: 1–5 mg/día.',
    efectos_adversos: 'Generalmente bien tolerado. Puede enmascarar déficit de B12 (anemia perniciosa).',
    contraindicaciones: 'Hipersensibilidad. NO usar sin B12 si hay sospecha de déficit de B12 (puede empeorar daño neurológico).',
    precauciones_adulto_mayor: 'Siempre descartar déficit de B12 antes/durante suplementación con ácido fólico.',
    interacciones: 'Metotrexato (rescate), fenitoína, sulfasalazina.',
    conservacion: 'Temperatura ambiente.',
  },

  CIANOCOBALAMINA: {
    categoria: 'Vitamina B12.',
    indicaciones: 'Anemia perniciosa, déficit de B12 (vegetarianos, gastritis atrófica, post-gastrectomía, uso crónico de metformina/IBP), neuropatía por déficit.',
    posologia: 'Oral: 1000 mcg/día. Inyectable: según pauta médica.',
    efectos_adversos: 'Mínimos. Rash, prurito.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Frecuente déficit subclínico en adulto mayor (>10%). Medir niveles si hay fatiga, anemia macrocítica, neuropatía o uso crónico de metformina/omeprazol.',
    interacciones: 'Cloranfenicol, omeprazol, metformina (reducen absorción).',
    conservacion: 'Temperatura ambiente, protegido de luz.',
  },

  'HIALURONATO DE SODIO': {
    categoria: 'Lubricante oftálmico (lágrimas artificiales) o intraarticular.',
    indicaciones: 'Ojo seco, irritación ocular, lubricación articular en artrosis (inyectable).',
    posologia: 'Oftálmico: 1 gota en cada ojo 3–6 veces al día o según necesidad.',
    efectos_adversos: 'Irritación leve transitoria. Visión borrosa pasajera.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Preferir presentación sin preservantes si requiere uso muy frecuente o crónico. Esperar 10 min antes de aplicar otro colirio.',
    interacciones: 'Ninguna relevante.',
    conservacion: 'Temperatura ambiente. Frasco abierto: usar dentro de 30 días (con preservante) o 12 h (monodosis sin preservante).',
  },

  CLOBETASOL: {
    categoria: 'Corticoide tópico de muy alta potencia.',
    indicaciones: 'Psoriasis, dermatitis severas, liquen plano, alopecia areata.',
    posologia: 'Aplicar capa fina 1–2 veces al día. Máximo 2 semanas continuas. No superar 50 g/semana.',
    efectos_adversos: 'Atrofia cutánea, estrías, telangiectasias, hipopigmentación, foliculitis, supresión adrenal con uso extenso/prolongado.',
    contraindicaciones: 'Infecciones cutáneas no tratadas, rosácea, dermatitis perioral, no usar en cara, axilas o pliegues.',
    precauciones_adulto_mayor: 'Piel adulto mayor más frágil: alto riesgo de atrofia. Limitar uso a corto plazo y áreas pequeñas. No usar bajo apósito oclusivo sin indicación.',
    interacciones: 'No relevantes por uso tópico estándar.',
    conservacion: 'Temperatura ambiente.',
  },

  BETAMETASONA: {
    categoria: 'Corticoide de potencia alta. Presentaciones tópicas, sistémicas e inyectables.',
    indicaciones: 'Dermatosis inflamatorias, alergias, asma severa, enfermedades reumáticas.',
    posologia: 'Tópico: 1–2 veces al día. Oral/inyectable: según indicación.',
    efectos_adversos: 'Tópico: atrofia, telangiectasias. Sistémico: hiperglucemia, hipertensión, osteoporosis, supresión adrenal, ganancia de peso, cataratas.',
    contraindicaciones: 'Infecciones no controladas, herpes ocular (tópico).',
    precauciones_adulto_mayor: 'Uso sistémico crónico: alto riesgo de osteoporosis, diabetes, cataratas e infecciones. Justificar bien la indicación y revisar periódicamente.',
    interacciones: 'AINEs (úlcera), antidiabéticos (hiperglucemia), vacunas vivas.',
    conservacion: 'Temperatura ambiente.',
  },

  PREDNISONA: {
    categoria: 'Corticoide sistémico oral.',
    indicaciones: 'Enfermedades autoinmunes, asma severa, EPOC exacerbado, dermatosis, prevención de rechazo.',
    posologia: 'Variable: 5–60 mg/día según indicación. Tomar en la mañana con alimentos.',
    efectos_adversos: 'Hiperglucemia, hipertensión, osteoporosis, miopatía, cataratas, glaucoma, infecciones, alteración del ánimo, insomnio, ganancia de peso, cara de luna.',
    contraindicaciones: 'Infecciones sistémicas no tratadas, úlcera activa.',
    precauciones_adulto_mayor: 'Riesgo elevado de descompensar diabetes/HTA, fracturas (suplementar Ca/D), cataratas. NO suspender bruscamente cursos largos: descenso gradual.',
    interacciones: 'AINEs (úlcera), antidiabéticos (hiperglucemia), warfarina, vacunas vivas (contraindicadas).',
    conservacion: 'Temperatura ambiente.',
  },

  WARFARINA: {
    categoria: 'Anticoagulante oral antagonista de vitamina K.',
    indicaciones: 'Prevención de tromboembolismo en fibrilación auricular, prótesis valvular, TVP/EP.',
    posologia: 'Dosis individualizada según INR (objetivo habitual 2,0–3,0). Tomar a la misma hora cada día.',
    efectos_adversos: 'Sangrado (gingival, nasal, digestivo, urinario, cerebral). Necrosis cutánea rara.',
    contraindicaciones: 'Embarazo, sangrado activo, cirugía reciente, hipertensión severa no controlada.',
    precauciones_adulto_mayor: 'Control estricto de INR. Vigilar caídas (riesgo de hemorragia cerebral). Mantener ingesta estable de verduras verdes (vitamina K). Reportar cualquier sangrado, hematomas anormales, cefalea súbita.',
    interacciones: 'MUCHAS: AINEs, aspirina, antibióticos (especialmente metronidazol, fluconazol, cotrimoxazol), amiodarona, estatinas, omeprazol. Consulte siempre antes de iniciar/suspender cualquier medicamento.',
    conservacion: 'Temperatura ambiente.',
  },

  ZINC: {
    categoria: 'Oligoelemento esencial.',
    indicaciones: 'Déficit de zinc, apoyo inmune, cicatrización, acrodermatitis enteropática.',
    posologia: 'Adultos: 15–40 mg/día. No exceder 40 mg/día sin indicación.',
    efectos_adversos: 'Náuseas, sabor metálico, déficit de cobre con uso prolongado a dosis altas.',
    contraindicaciones: 'Hemocromatosis.',
    precauciones_adulto_mayor: 'No exceder 25 mg/día en uso prolongado para no inducir déficit de cobre.',
    interacciones: 'Reduce absorción de quinolonas, tetraciclinas, hierro, levotiroxina (separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  'CONDROITINA + GLUCOSAMINA': {
    categoria: 'Suplemento sintomático para artrosis.',
    indicaciones: 'Artrosis leve a moderada (especialmente rodilla).',
    posologia: 'Adultos: 1500 mg glucosamina + 1200 mg condroitina/día.',
    efectos_adversos: 'Molestias digestivas leves. Cefalea, somnolencia raros.',
    contraindicaciones: 'Alergia a mariscos (glucosamina puede derivar de crustáceos).',
    precauciones_adulto_mayor: 'Evidencia modesta y heterogénea. Algunos pacientes refieren alivio. Si tras 3 meses no hay mejoría, suspender.',
    interacciones: 'Posible interacción con warfarina (vigilar INR).',
    conservacion: 'Temperatura ambiente.',
  },

  PROBIOTICOS: {
    categoria: 'Microorganismos vivos que favorecen el equilibrio de la microbiota intestinal.',
    indicaciones: 'Prevención y tratamiento de diarrea (asociada a antibióticos, infecciosa), colon irritable, apoyo digestivo.',
    posologia: 'Variable según cepa y producto. Ver etiqueta. Tomar separado del antibiótico al menos 2 horas.',
    efectos_adversos: 'Gases, distensión leve transitoria.',
    contraindicaciones: 'Inmunosupresión severa, catéteres centrales (riesgo de translocación), pancreatitis aguda severa.',
    precauciones_adulto_mayor: 'Generalmente seguro. Útil junto con antibióticos para prevenir diarrea por C. difficile.',
    interacciones: 'Antibióticos (separar tomas).',
    conservacion: 'Según etiqueta — muchos requieren refrigeración.',
  },

  IVERMECTINA: {
    categoria: 'Antiparasitario.',
    indicaciones: 'Pediculosis, escabiosis (sarna), estrongiloidiasis. Rosácea (tópica).',
    posologia: 'Sarna/escabiosis: dosis única oral 200 mcg/kg, repetir a los 7–14 días. Tópico según indicación.',
    efectos_adversos: 'Prurito transitorio, cefalea, mareo, náuseas.',
    contraindicaciones: 'Hipersensibilidad. Cautela en hepatopatía.',
    precauciones_adulto_mayor: 'Bien tolerado. Tratar simultáneamente a contactos cercanos en escabiosis.',
    interacciones: 'Warfarina (potencia).',
    conservacion: 'Temperatura ambiente.',
  },

  LIDOCAINA: {
    categoria: 'Anestésico local tipo amida.',
    indicaciones: 'Anestesia local, antiarrítmico (IV), dolor neuropático localizado (parches).',
    posologia: 'Variable según presentación. Tópica/spray: aplicar según necesidad sobre la zona.',
    efectos_adversos: 'Reacciones locales. Sistémicas con sobredosis: arritmias, convulsiones, depresión SNC.',
    contraindicaciones: 'Alergia a anestésicos amídicos, bloqueo AV severo.',
    precauciones_adulto_mayor: 'Por vía sistémica reducir dosis. Tópica es segura en zonas pequeñas.',
    interacciones: 'Antiarrítmicos, betabloqueantes (potencian toxicidad).',
    conservacion: 'Temperatura ambiente.',
  },

  CICLOBENZAPRINA: {
    categoria: 'Relajante muscular de acción central, estructura tricíclica.',
    indicaciones: 'Espasmo muscular agudo asociado a dolor musculoesquelético.',
    posologia: 'Adultos: 5–10 mg cada 8 h. Tratamiento corto (máximo 2–3 semanas).',
    efectos_adversos: 'Sedación marcada, sequedad bucal, mareo, visión borrosa, retención urinaria, estreñimiento (efectos anticolinérgicos).',
    contraindicaciones: 'Glaucoma agudo, hipertiroidismo, arritmias, infarto reciente, retención urinaria, uso con IMAO.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): efectos anticolinérgicos peligrosos — confusión, caídas, retención urinaria. Si se usa, dosis mínima por pocos días.',
    interacciones: 'IMAO (síndrome serotoninérgico/hipertensivo), depresores SNC, anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  'PARGEVERINA CLORHIDRATO': {
    categoria: 'Antiespasmódico anticolinérgico.',
    indicaciones: 'Cólicos abdominales, dismenorrea, espasmos digestivos.',
    posologia: 'Adultos: 5–10 mg cada 6–8 h.',
    efectos_adversos: 'Sequedad bucal, visión borrosa, retención urinaria, estreñimiento, taquicardia.',
    contraindicaciones: 'Glaucoma, hiperplasia prostática, íleo paralítico, miastenia.',
    precauciones_adulto_mayor: 'Cautela por efectos anticolinérgicos: caídas, confusión, retención urinaria.',
    interacciones: 'Otros anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  ALBENDAZOL: {
    categoria: 'Antiparasitario antihelmíntico de amplio espectro.',
    indicaciones: 'Oxiuros, áscaris, anquilostomas, tricocéfalos, giardiasis, hidatidosis, neurocisticercosis.',
    posologia: 'Adultos: 400 mg dosis única (oxiuros, repetir a las 2 semanas). Otras parasitosis según indicación.',
    efectos_adversos: 'Náuseas, dolor abdominal, cefalea. En tratamientos prolongados: hepatotoxicidad, leucopenia.',
    contraindicaciones: 'Embarazo (1er trimestre).',
    precauciones_adulto_mayor: 'Tratamientos cortos son seguros. Tratamientos largos requieren control hepático y hemograma.',
    interacciones: 'Inductores hepáticos (carbamazepina, fenitoína).',
    conservacion: 'Temperatura ambiente.',
  },

  ARIPIPRAZOL: {
    categoria: 'Antipsicótico atípico, agonista parcial dopaminérgico.',
    indicaciones: 'Esquizofrenia, trastorno bipolar, depresión resistente (adyuvante), irritabilidad en autismo.',
    posologia: 'Adultos: 10–30 mg/día.',
    efectos_adversos: 'Acatisia, insomnio, náuseas, cefalea. Menor ganancia de peso y sedación que otros antipsicóticos.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'EVITAR en demencia (mayor mortalidad como otros antipsicóticos). Si se usa, iniciar con 5 mg.',
    interacciones: 'Inductores e inhibidores CYP3A4 y CYP2D6.',
    conservacion: 'Temperatura ambiente.',
  },

  DULOXETINA: {
    categoria: 'Antidepresivo IRSN (recaptación de serotonina y noradrenalina).',
    indicaciones: 'Depresión, ansiedad generalizada, dolor neuropático diabético, fibromialgia, dolor crónico musculoesquelético.',
    posologia: 'Adultos: 30–60 mg/día. Tomar con o sin alimentos.',
    efectos_adversos: 'Náuseas, sequedad bucal, somnolencia o insomnio, sudoración, hipertensión, disfunción sexual, hiponatremia.',
    contraindicaciones: 'Glaucoma ángulo estrecho no tratado, IMAO, insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'Iniciar con 30 mg. Vigilar presión arterial y sodio. NO suspender bruscamente.',
    interacciones: 'IMAO, otros serotoninérgicos, anticoagulantes, AINEs, inhibidores CYP1A2 y CYP2D6.',
    conservacion: 'Temperatura ambiente.',
  },

  TAMSULOSINA: {
    categoria: 'Alfa-bloqueante uroselectivo.',
    indicaciones: 'Hiperplasia prostática benigna sintomática.',
    posologia: 'Adultos: 0,4 mg/día, 30 min después de la misma comida cada día.',
    efectos_adversos: 'Hipotensión ortostática, mareo, eyaculación retrógrada, congestión nasal, síndrome del iris flácido intraoperatorio.',
    contraindicaciones: 'Hipotensión ortostática severa, insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'Vigilar caídas las primeras semanas. Advertir al oftalmólogo antes de cirugía de catarata.',
    interacciones: 'PDE5 (sildenafil, tadalafilo): hipotensión. Otros antihipertensivos. Inhibidores CYP3A4.',
    conservacion: 'Temperatura ambiente.',
  },

  TIAMAZOL: {
    categoria: 'Antitiroideo.',
    indicaciones: 'Hipertiroidismo (enfermedad de Graves), preparación para tratamiento definitivo.',
    posologia: 'Adultos: inicio 15–30 mg/día, mantención 5–10 mg/día.',
    efectos_adversos: 'Rash, prurito, agranulocitosis (rara pero grave: fiebre, dolor de garganta → consultar urgente), hepatitis.',
    contraindicaciones: 'Embarazo (1er trimestre, preferir propiltiouracilo), agranulocitosis previa.',
    precauciones_adulto_mayor: 'Hemograma y pruebas hepáticas antes de iniciar. Suspender ante fiebre o dolor de garganta y consultar urgente.',
    interacciones: 'Anticoagulantes, digoxina, betabloqueantes (ajuste al normalizar tiroides).',
    conservacion: 'Temperatura ambiente.',
  },

  DILTIAZEM: {
    categoria: 'Antagonista de canales de calcio (no dihidropiridina).',
    indicaciones: 'Hipertensión, angina, control de frecuencia en fibrilación auricular.',
    posologia: 'Adultos: 120–360 mg/día. Presentaciones de liberación prolongada en 1 toma.',
    efectos_adversos: 'Bradicardia, edema, estreñimiento, cefalea, bloqueo AV.',
    contraindicaciones: 'Bloqueo AV 2°–3°, insuficiencia cardíaca severa, hipotensión.',
    precauciones_adulto_mayor: 'Riesgo de bradicardia (no combinar con betabloqueantes salvo indicación específica).',
    interacciones: 'Simvastatina (limitar a 10 mg), betabloqueantes, digoxina, carbamazepina, ciclosporina.',
    conservacion: 'Temperatura ambiente.',
  },

  FLUNARIZINA: {
    categoria: 'Antagonista de canales de calcio (selectivo cerebral).',
    indicaciones: 'Profilaxis de migraña, vértigo periférico.',
    posologia: 'Adultos: 5–10 mg en la noche.',
    efectos_adversos: 'Somnolencia, ganancia de peso, parkinsonismo, depresión.',
    contraindicaciones: 'Depresión, parkinsonismo previo.',
    precauciones_adulto_mayor: 'EVITAR: alto riesgo de parkinsonismo y depresión en adulto mayor.',
    interacciones: 'Depresores SNC, alcohol.',
    conservacion: 'Temperatura ambiente.',
  },

  BETAHISTINA: {
    categoria: 'Análogo de histamina con efecto vasodilatador del oído interno.',
    indicaciones: 'Vértigo, enfermedad de Ménière, tinnitus de origen vestibular.',
    posologia: 'Adultos: 8–16 mg cada 8 h con alimentos.',
    efectos_adversos: 'Náuseas, cefalea, dispepsia.',
    contraindicaciones: 'Feocromocitoma, úlcera péptica activa.',
    precauciones_adulto_mayor: 'Generalmente bien tolerado. Tomar con alimentos.',
    interacciones: 'Antihistamínicos (antagonismo teórico).',
    conservacion: 'Temperatura ambiente.',
  },

  ALOPURINOL: {
    categoria: 'Inhibidor de la xantina oxidasa. Hipouricemiante.',
    indicaciones: 'Hiperuricemia, gota crónica, prevención de litiasis úrica, profilaxis del síndrome de lisis tumoral.',
    posologia: 'Adultos: inicio 100 mg/día, titular según ácido úrico hasta 300–600 mg/día. Tomar con alimentos.',
    efectos_adversos: 'Rash (puede ser severo: síndrome DRESS, Stevens-Johnson), alteración hepática, molestias gastrointestinales. Reagudización de gota al inicio (cubrir con colchicina o AINE).',
    contraindicaciones: 'Hipersensibilidad. Crisis aguda de gota (esperar 2–4 semanas).',
    precauciones_adulto_mayor: 'Iniciar con 50–100 mg/día y subir lentamente. Ajustar a función renal. Suspender de inmediato ante cualquier rash y consultar. Tomar abundante agua (2 L/día).',
    interacciones: 'Azatioprina, mercaptopurina (toxicidad severa — contraindicada). Warfarina (potencia). Amoxicilina (rash). Diuréticos tiazídicos.',
    conservacion: 'Temperatura ambiente.',
  },

  AMITRIPTILINA: {
    categoria: 'Antidepresivo tricíclico.',
    indicaciones: 'Dolor neuropático, profilaxis de migraña, insomnio, depresión (uso menor hoy por toxicidad).',
    posologia: 'Dolor neuropático: 10–75 mg en la noche. Iniciar bajo y titular.',
    efectos_adversos: 'Sedación, sequedad bucal, visión borrosa, estreñimiento, retención urinaria, hipotensión ortostática, prolongación QT, ganancia de peso, confusión.',
    contraindicaciones: 'Infarto reciente, arritmias, glaucoma ángulo estrecho, hiperplasia prostática severa, retención urinaria, IMAO.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): alto riesgo de caídas, confusión, retención urinaria, arritmias. Si se requiere para dolor neuropático, preferir gabapentina, pregabalina o duloxetina.',
    interacciones: 'IMAO, ISRS, tramadol (síndrome serotoninérgico), QT-prolongadores, anticolinérgicos, alcohol.',
    conservacion: 'Temperatura ambiente.',
  },

  AMIODARONA: {
    categoria: 'Antiarrítmico clase III.',
    indicaciones: 'Arritmias ventriculares y supraventriculares graves, fibrilación auricular refractaria.',
    posologia: 'Carga: 200 mg 3 veces/día por 1 semana. Mantención: 100–400 mg/día.',
    efectos_adversos: 'Depósitos corneales, fotosensibilidad cutánea (color azul-gris con uso prolongado), disfunción tiroidea (hipo o hiper), neumonitis, hepatitis, neuropatía, prolongación QT.',
    contraindicaciones: 'Bradicardia severa, bloqueo AV, prolongación QT, disfunción tiroidea no controlada, embarazo.',
    precauciones_adulto_mayor: 'Pruebas tiroideas, hepáticas y radiografía de tórax basal y cada 6 meses. Examen oftalmológico anual. Protección solar estricta. Reportar tos, disnea o pérdida de peso.',
    interacciones: 'MUCHAS: warfarina (potencia), digoxina (toxicidad), estatinas (limitar dosis), betabloqueantes/calcioantagonistas (bradicardia), QT-prolongadores.',
    conservacion: 'Temperatura ambiente, protegido de luz.',
  },

  VALSARTAN: {
    categoria: 'Antihipertensivo ARA II.',
    indicaciones: 'Hipertensión, insuficiencia cardíaca, post-infarto.',
    posologia: 'Adultos: 80–320 mg/día en una toma.',
    efectos_adversos: 'Mareo, hipotensión, hiperkalemia, falla renal en deshidratados.',
    contraindicaciones: 'Embarazo, estenosis renal bilateral.',
    precauciones_adulto_mayor: 'Iniciar con 40–80 mg. Control de potasio y creatinina.',
    interacciones: 'AINEs, diuréticos ahorradores K+, litio.',
    conservacion: 'Temperatura ambiente.',
  },

  TELMISARTAN: {
    categoria: 'Antihipertensivo ARA II de vida media larga.',
    indicaciones: 'Hipertensión, prevención cardiovascular.',
    posologia: 'Adultos: 40–80 mg/día.',
    efectos_adversos: 'Mareo, hipotensión, hiperkalemia, dolor de espalda, sinusitis.',
    contraindicaciones: 'Embarazo, obstrucción biliar severa.',
    precauciones_adulto_mayor: 'Buen perfil. Iniciar con 20–40 mg.',
    interacciones: 'AINEs, diuréticos ahorradores K+, litio, digoxina.',
    conservacion: 'Temperatura ambiente, en envase original (sensible a humedad).',
  },

  CANDESARTAN: {
    categoria: 'Antihipertensivo ARA II.',
    indicaciones: 'Hipertensión, insuficiencia cardíaca.',
    posologia: 'Adultos: 8–32 mg/día.',
    efectos_adversos: 'Mareo, hipotensión, hiperkalemia, falla renal.',
    contraindicaciones: 'Embarazo, insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'Iniciar con 4 mg. Control de potasio y creatinina.',
    interacciones: 'AINEs, diuréticos ahorradores K+, litio.',
    conservacion: 'Temperatura ambiente.',
  },

  OLMESARTAN: {
    categoria: 'Antihipertensivo ARA II.',
    indicaciones: 'Hipertensión arterial.',
    posologia: 'Adultos: 20–40 mg/día.',
    efectos_adversos: 'Mareo, hipotensión, hiperkalemia. Raramente: enteropatía similar a celiaquía (diarrea crónica con baja de peso).',
    contraindicaciones: 'Embarazo.',
    precauciones_adulto_mayor: 'Suspender ante diarrea crónica inexplicada.',
    interacciones: 'AINEs, diuréticos, litio.',
    conservacion: 'Temperatura ambiente.',
  },

  DOXICICLINA: {
    categoria: 'Antibiótico tetraciclina.',
    indicaciones: 'Infecciones respiratorias atípicas, ETS, acné, leptospirosis, rosácea, profilaxis de malaria.',
    posologia: 'Adultos: 100 mg cada 12 h o 200 mg/día. Tomar con abundante agua y en posición erguida, alejado de lácteos y antiácidos.',
    efectos_adversos: 'Esofagitis si no se toma con agua suficiente, fotosensibilidad, molestias gástricas, candidiasis, decoloración dental en menores.',
    contraindicaciones: 'Embarazo, lactancia, menores de 8 años.',
    precauciones_adulto_mayor: 'Tomar con un vaso lleno de agua y permanecer parado/sentado 30 min para evitar esofagitis. Protección solar.',
    interacciones: 'Antiácidos, hierro, calcio, lácteos (separar 2 h). Warfarina (potencia). Anticonceptivos orales.',
    conservacion: 'Temperatura ambiente, protegido de luz.',
  },

  CLINDAMICINA: {
    categoria: 'Antibiótico lincosamida.',
    indicaciones: 'Infecciones por anaerobios, piel y partes blandas (estafilococo, estreptococo), dentales, ginecológicas.',
    posologia: 'Adultos: 150–450 mg cada 6 h. Con abundante agua.',
    efectos_adversos: 'Diarrea (alto riesgo de colitis por C. difficile), náuseas, sabor metálico, rash.',
    contraindicaciones: 'Antecedente de colitis pseudomembranosa.',
    precauciones_adulto_mayor: 'Mayor riesgo de colitis por C. difficile. Suspender ante diarrea severa o con sangre y consultar urgente.',
    interacciones: 'Bloqueantes neuromusculares.',
    conservacion: 'Temperatura ambiente.',
  },

  CEFADROXILO: {
    categoria: 'Antibiótico cefalosporina de 1ª generación.',
    indicaciones: 'Infecciones de piel, urinarias no complicadas, faringoamigdalitis estreptocócica.',
    posologia: 'Adultos: 500 mg–1 g cada 12 h por 7–10 días.',
    efectos_adversos: 'Diarrea, náuseas, rash, candidiasis.',
    contraindicaciones: 'Alergia a cefalosporinas. Cautela en alérgicos a penicilina.',
    precauciones_adulto_mayor: 'Ajustar dosis en falla renal.',
    interacciones: 'Probenecid (aumenta niveles), anticoagulantes.',
    conservacion: 'Suspensión: refrigerar y usar dentro de 14 días.',
  },

  NITROFURANTOINA: {
    categoria: 'Antibiótico urinario nitrofurano.',
    indicaciones: 'Infección urinaria baja no complicada (cistitis).',
    posologia: 'Adultos: 100 mg cada 6–8 h por 5–7 días. Tomar con alimentos.',
    efectos_adversos: 'Náuseas, cefalea, neumonitis (aguda o crónica con uso prolongado), neuropatía, hepatotoxicidad. Orina marrón inocua.',
    contraindicaciones: 'Insuficiencia renal (eGFR <30: ineficaz y tóxico), embarazo a término, neonatos.',
    precauciones_adulto_mayor: 'EVITAR si eGFR <30 (criterios Beers). Suspender ante tos seca, disnea o dolor torácico (sospecha de neumonitis). No usar como profilaxis prolongada.',
    interacciones: 'Antiácidos con magnesio (reducen absorción), probenecid.',
    conservacion: 'Temperatura ambiente, protegido de luz.',
  },

  HIDROXICINA: {
    categoria: 'Antihistamínico H1 de primera generación con efecto ansiolítico.',
    indicaciones: 'Prurito, urticaria, ansiedad leve, premedicación.',
    posologia: 'Adultos: 25 mg cada 6–8 h. Máximo 100 mg/día.',
    efectos_adversos: 'Sedación marcada, sequedad bucal, prolongación QT, retención urinaria.',
    contraindicaciones: 'Prolongación QT, hipersensibilidad.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): sedación, efectos anticolinérgicos, riesgo de caídas y QT.',
    interacciones: 'QT-prolongadores, depresores SNC, anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  OXIBUTININA: {
    categoria: 'Anticolinérgico para vejiga hiperactiva.',
    indicaciones: 'Incontinencia urinaria de urgencia, vejiga hiperactiva.',
    posologia: 'Adultos: 5 mg cada 8–12 h. Forma de liberación prolongada: 5–10 mg/día.',
    efectos_adversos: 'Sequedad bucal severa, estreñimiento, retención urinaria, visión borrosa, confusión, taquicardia.',
    contraindicaciones: 'Glaucoma, retención urinaria, íleo, miastenia.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): efectos anticolinérgicos peligrosos, riesgo de deterioro cognitivo y demencia con uso prolongado. Preferir alternativas (mirabegrón, solifenacina) o medidas conductuales.',
    interacciones: 'Otros anticolinérgicos, inhibidores CYP3A4.',
    conservacion: 'Temperatura ambiente.',
  },

  MINOXIDIL: {
    categoria: 'Vasodilatador. Tópico para alopecia androgénica.',
    indicaciones: 'Tópico: alopecia androgénica masculina y femenina. Oral (especialista): hipertensión refractaria.',
    posologia: 'Tópico: aplicar 1 ml o equivalente 2 veces al día sobre cuero cabelludo seco. Resultados después de 3–6 meses.',
    efectos_adversos: 'Tópico: irritación, dermatitis, hipertricosis facial (en mujeres). Resultados se pierden si se suspende. Caída inicial transitoria a las 2–6 semanas.',
    contraindicaciones: 'Hipersensibilidad. No usar en cuero cabelludo lesionado.',
    precauciones_adulto_mayor: 'Lavarse las manos tras aplicar para evitar crecimiento de vello en otras zonas.',
    interacciones: 'Otros tópicos en la misma zona.',
    conservacion: 'Temperatura ambiente.',
  },

  MUPIROCINA: {
    categoria: 'Antibiótico tópico.',
    indicaciones: 'Impétigo, infecciones cutáneas superficiales por estafilococo, descolonización nasal de S. aureus.',
    posologia: 'Aplicar 3 veces al día por 7–10 días.',
    efectos_adversos: 'Ardor leve, prurito.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Seguro tópicamente.',
    interacciones: 'No relevantes.',
    conservacion: 'Temperatura ambiente.',
  },

  PERMETRINA: {
    categoria: 'Insecticida tópico (piretroide).',
    indicaciones: 'Escabiosis (sarna), pediculosis (piojos).',
    posologia: 'Escabiosis: aplicar crema al 5% en todo el cuerpo (cuello a pies), dejar 8–14 h, repetir a los 7 días. Pediculosis: loción al 1% en cuero cabelludo, dejar 10 min, enjuagar; repetir a los 7 días.',
    efectos_adversos: 'Prurito transitorio (el prurito puede persistir 2–4 semanas tras curación), eritema leve.',
    contraindicaciones: 'Hipersensibilidad. Lactantes <2 meses.',
    precauciones_adulto_mayor: 'Tratar simultáneamente a contactos. Lavar ropa de cama y vestimenta a 60 °C.',
    interacciones: 'No relevantes.',
    conservacion: 'Temperatura ambiente.',
  },

  NISTATINA: {
    categoria: 'Antifúngico poliénico.',
    indicaciones: 'Candidiasis oral (muguet), cutánea, vaginal.',
    posologia: 'Oral (enjuague): 1–2 ml 4 veces/día, mantener en boca antes de tragar. Cutáneo/vaginal: aplicar 2–4 veces al día.',
    efectos_adversos: 'Bien tolerado. Náuseas leves orales.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Útil en candidiasis oral asociada a prótesis dental o uso de inhaladores con corticoides (enjuagar boca tras inhalar).',
    interacciones: 'No relevantes.',
    conservacion: 'Temperatura ambiente.',
  },

  DEXAMETASONA: {
    categoria: 'Corticoide de muy alta potencia y acción prolongada.',
    indicaciones: 'Edema cerebral, antiemético en quimioterapia, enfermedades autoinmunes severas, COVID-19 con oxígeno.',
    posologia: 'Variable según indicación: 0,5–24 mg/día.',
    efectos_adversos: 'Mismos que otros corticoides sistémicos (hiperglucemia, HTA, osteoporosis, supresión adrenal, insomnio) pero más potente.',
    contraindicaciones: 'Infecciones sistémicas no tratadas.',
    precauciones_adulto_mayor: 'Cursos cortos son seguros. Uso crónico requiere descenso gradual.',
    interacciones: 'AINEs, antidiabéticos, anticoagulantes, vacunas vivas.',
    conservacion: 'Temperatura ambiente.',
  },

  'FLUTICASONA': {
    categoria: 'Corticoide inhalatorio/nasal de alta potencia.',
    indicaciones: 'Asma persistente (inhalatorio), rinitis alérgica (nasal), poliposis nasal.',
    posologia: 'Inhalado: 100–500 mcg cada 12 h. Nasal: 1–2 puffs en cada fosa una vez al día.',
    efectos_adversos: 'Inhalatorio: candidiasis oral (enjuagar boca tras inhalar), disfonía. Nasal: epistaxis, irritación.',
    contraindicaciones: 'Hipersensibilidad. Infecciones respiratorias activas no tratadas.',
    precauciones_adulto_mayor: 'Enjuagar boca tras cada inhalación. Uso prolongado a dosis altas puede causar osteoporosis, cataratas o supresión adrenal leve.',
    interacciones: 'Inhibidores CYP3A4 (ritonavir, ketoconazol) aumentan exposición sistémica.',
    conservacion: 'Temperatura ambiente.',
  },

  TOBRAMICINA: {
    categoria: 'Antibiótico aminoglucósido. Vía tópica oftálmica habitual.',
    indicaciones: 'Conjuntivitis bacteriana, blefaritis. Inhalatorio en fibrosis quística.',
    posologia: 'Colirio: 1–2 gotas cada 4–6 h por 5–7 días.',
    efectos_adversos: 'Irritación local, hipersensibilidad.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'No tocar gotero con el ojo. Si usa otro colirio, separar 10 min.',
    interacciones: 'Mínimas tópicamente.',
    conservacion: 'Temperatura ambiente. Frasco abierto: usar dentro de 30 días.',
  },

  GENTAMICINA: {
    categoria: 'Antibiótico aminoglucósido.',
    indicaciones: 'Tópica oftálmica/cutánea, sistémica en infecciones graves hospitalarias.',
    posologia: 'Colirio: 1–2 gotas cada 4 h. Crema/ungüento: 2–3 veces/día.',
    efectos_adversos: 'Tópica: irritación, sensibilización. Sistémica: nefro y ototoxicidad.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Tópica es segura. Sistémica requiere ajuste renal y monitoreo de niveles.',
    interacciones: 'Mínimas tópicamente.',
    conservacion: 'Temperatura ambiente.',
  },

  LACTULOSA: {
    categoria: 'Laxante osmótico.',
    indicaciones: 'Estreñimiento crónico, encefalopatía hepática.',
    posologia: 'Adultos: 15–30 ml/día. Efecto en 24–48 h.',
    efectos_adversos: 'Flatulencia, distensión abdominal, cólicos leves.',
    contraindicaciones: 'Galactosemia, obstrucción intestinal.',
    precauciones_adulto_mayor: 'Excelente opción para estreñimiento crónico en adulto mayor. Mantener hidratación adecuada.',
    interacciones: 'Antiácidos pueden reducir efecto.',
    conservacion: 'Temperatura ambiente.',
  },

  'MACROGOL': {
    categoria: 'Laxante osmótico (polietilenglicol).',
    indicaciones: 'Estreñimiento crónico, preparación intestinal.',
    posologia: 'Adultos: 1 sobre disuelto en agua, 1–2 veces al día.',
    efectos_adversos: 'Flatulencia, distensión, diarrea con dosis altas. Pocas alteraciones electrolíticas.',
    contraindicaciones: 'Obstrucción intestinal, perforación, megacolon.',
    precauciones_adulto_mayor: 'Primera elección en estreñimiento crónico del adulto mayor por buen perfil. Beber abundante agua.',
    interacciones: 'Puede reducir absorción de otros fármacos: separar 1 h.',
    conservacion: 'Temperatura ambiente.',
  },

  SIMETICONA: {
    categoria: 'Antiflatulento (agente tensoactivo).',
    indicaciones: 'Distensión, meteorismo, dolor por gases.',
    posologia: 'Adultos: 40–125 mg después de comidas y al acostarse. Máximo 500 mg/día.',
    efectos_adversos: 'Mínimos. No se absorbe.',
    contraindicaciones: 'Obstrucción intestinal.',
    precauciones_adulto_mayor: 'Muy seguro. Sin interacciones.',
    interacciones: 'Puede reducir absorción de levotiroxina (separar 4 h).',
    conservacion: 'Temperatura ambiente.',
  },

  'DIOSMINA + HESPERIDINA': {
    categoria: 'Flavonoides venotónicos.',
    indicaciones: 'Insuficiencia venosa crónica, hemorroides agudas, edema vinculado a estasis venosa.',
    posologia: 'Adultos: 500 mg cada 12 h (mantención) o pauta intensiva en crisis hemorroidal.',
    efectos_adversos: 'Molestias gastrointestinales leves, cefalea.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Buen perfil de seguridad. Combinar con medidas posturales y soporte elástico.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  ACETAZOLAMIDA: {
    categoria: 'Inhibidor de la anhidrasa carbónica.',
    indicaciones: 'Glaucoma, mal de altura, ciertas epilepsias, edema refractario.',
    posologia: 'Glaucoma: 250 mg cada 6–8 h. Mal de altura: 125–250 mg cada 12 h.',
    efectos_adversos: 'Parestesias (hormigueo), poliuria, acidosis metabólica, hipokalemia, fotosensibilidad, sabor metálico de bebidas con gas.',
    contraindicaciones: 'Insuficiencia hepática/renal severa, alergia a sulfas, hipokalemia, hiponatremia.',
    precauciones_adulto_mayor: 'Control de electrolitos. Riesgo de deshidratación.',
    interacciones: 'Aspirina dosis altas (toxicidad), salicilatos, litio.',
    conservacion: 'Temperatura ambiente.',
  },

  ACENOCUMAROL: {
    categoria: 'Anticoagulante oral antagonista de vitamina K (similar a warfarina, vida media más corta).',
    indicaciones: 'Igual a warfarina: fibrilación auricular, prótesis valvular, TVP/EP.',
    posologia: 'Dosis individualizada según INR (objetivo habitual 2–3).',
    efectos_adversos: 'Sangrado en cualquier sitio, necrosis cutánea rara.',
    contraindicaciones: 'Embarazo, sangrado activo, hipertensión severa.',
    precauciones_adulto_mayor: 'Control estricto de INR. Vigilar caídas. Mantener ingesta estable de verduras (vitamina K). Reportar cualquier sangrado.',
    interacciones: 'Igual a warfarina: AINEs, aspirina, antibióticos (metronidazol, fluconazol), amiodarona, estatinas, omeprazol.',
    conservacion: 'Temperatura ambiente.',
  },

  CARBOCISTEINA: {
    categoria: 'Mucolítico.',
    indicaciones: 'Tos productiva con secreción espesa, bronquitis.',
    posologia: 'Adultos: 750 mg cada 8 h. Con abundante agua.',
    efectos_adversos: 'Náuseas, diarrea, dolor abdominal.',
    contraindicaciones: 'Úlcera activa, hipersensibilidad.',
    precauciones_adulto_mayor: 'Hidratación adecuada potencia efecto.',
    interacciones: 'Antitusivos (acumulan secreciones).',
    conservacion: 'Temperatura ambiente.',
  },

  BROMHEXINA: {
    categoria: 'Mucolítico.',
    indicaciones: 'Tos productiva, bronquitis aguda y crónica.',
    posologia: 'Adultos: 8–16 mg cada 8 h.',
    efectos_adversos: 'Náuseas, dolor abdominal, raras reacciones cutáneas.',
    contraindicaciones: 'Úlcera activa.',
    precauciones_adulto_mayor: 'Beber agua abundante.',
    interacciones: 'Antitusivos.',
    conservacion: 'Temperatura ambiente.',
  },

  LEVODROPROPIZINA: {
    categoria: 'Antitusivo periférico no opioide.',
    indicaciones: 'Tos seca irritativa.',
    posologia: 'Adultos: 60 mg cada 8 h. No exceder 3 dosis/día.',
    efectos_adversos: 'Mareo, somnolencia leve, molestias gastrointestinales.',
    contraindicaciones: 'Hipersensibilidad, insuficiencia hepática severa.',
    precauciones_adulto_mayor: 'No usar en tos productiva. Para tos irritativa nocturna.',
    interacciones: 'Pocas. Cuidado con sedantes.',
    conservacion: 'Temperatura ambiente.',
  },

  NOSCAPINA: {
    categoria: 'Antitusivo no opioide derivado del opio (sin actividad analgésica ni adictiva).',
    indicaciones: 'Tos seca.',
    posologia: 'Adultos: 25–50 mg cada 6 h.',
    efectos_adversos: 'Náuseas, somnolencia leve.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Útil para tos nocturna. No combinar con mucolíticos.',
    interacciones: 'Warfarina (puede potenciar).',
    conservacion: 'Temperatura ambiente.',
  },

  'AC TRANEXAMICO': {
    categoria: 'Antifibrinolítico.',
    indicaciones: 'Sangrado menstrual abundante (menorragia), epistaxis recurrente, sangrados quirúrgicos, hereditarios.',
    posologia: 'Menorragia: 1 g cada 8 h por hasta 4 días durante el periodo.',
    efectos_adversos: 'Náuseas, diarrea, mareo. Raramente trombosis.',
    contraindicaciones: 'Antecedente de trombosis venosa o arterial, hematuria.',
    precauciones_adulto_mayor: 'Evaluar riesgo trombótico individualmente.',
    interacciones: 'Anticonceptivos hormonales (riesgo trombótico aumentado).',
    conservacion: 'Temperatura ambiente.',
  },

  'AC MEFENAMICO': {
    categoria: 'AINE derivado del ácido fenámico.',
    indicaciones: 'Dolor leve a moderado, dismenorrea, menorragia.',
    posologia: 'Adultos: 500 mg inicial, luego 250 mg cada 6 h. Máximo 7 días.',
    efectos_adversos: 'Gastritis, diarrea (frecuente), náuseas, riesgo renal y de sangrado.',
    contraindicaciones: 'Úlcera, insuficiencia renal o hepática, embarazo (3er trimestre).',
    precauciones_adulto_mayor: 'Mismas cautelas que otros AINEs. Diarrea es frecuente.',
    interacciones: 'Anticoagulantes, IECA, diuréticos, litio.',
    conservacion: 'Temperatura ambiente.',
  },

  CLONIXINATO: {
    categoria: 'Analgésico antiinflamatorio (clonixinato de lisina).',
    indicaciones: 'Dolor leve a moderado, cólicos, cefalea, dental.',
    posologia: 'Adultos: 125–250 mg cada 6–8 h.',
    efectos_adversos: 'Náuseas, somnolencia, gastritis (menor que AINEs clásicos).',
    contraindicaciones: 'Alergia a salicilatos, úlcera activa.',
    precauciones_adulto_mayor: 'Mejor tolerancia gástrica que AINEs convencionales pero similares precauciones renales.',
    interacciones: 'Anticoagulantes, AINEs, alcohol.',
    conservacion: 'Temperatura ambiente.',
  },

  ISOTRETINOINA: {
    categoria: 'Retinoide sistémico.',
    indicaciones: 'Acné severo, nodulo-quístico o resistente.',
    posologia: 'Adultos: 0,5–1 mg/kg/día con alimentos grasos. Tratamiento de 4–6 meses.',
    efectos_adversos: 'Sequedad de piel, labios, ojos; epistaxis, mialgias, elevación de transaminasas y lípidos, fotosensibilidad. Teratogénico.',
    contraindicaciones: 'Embarazo (absoluta), lactancia, hepatopatía, hipervitaminosis A.',
    precauciones_adulto_mayor: 'Indicación dermatológica especializada. Pruebas hepáticas y lípidos antes y durante.',
    interacciones: 'Tetraciclinas (hipertensión intracraneal), vitamina A, alcohol.',
    conservacion: 'Temperatura ambiente, protegido de luz.',
  },

  LAMOTRIGINA: {
    categoria: 'Antiepiléptico y estabilizador del ánimo.',
    indicaciones: 'Epilepsia parcial y generalizada, trastorno bipolar (mantenimiento).',
    posologia: 'Adultos: titulación lenta desde 25 mg/día hasta 200–400 mg/día.',
    efectos_adversos: 'Rash (importante: puede evolucionar a Stevens-Johnson — suspender de inmediato), cefalea, mareo, visión borrosa.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Titulación muy lenta para evitar rash. Suspender ante cualquier exantema.',
    interacciones: 'Valproato (aumenta niveles — reducir dosis), anticonceptivos orales, carbamazepina, fenitoína.',
    conservacion: 'Temperatura ambiente.',
  },

  'AC VALPROICO': {
    categoria: 'Antiepiléptico de amplio espectro y estabilizador del ánimo.',
    indicaciones: 'Epilepsia generalizada y parcial, trastorno bipolar, profilaxis de migraña.',
    posologia: 'Adultos: 500–2000 mg/día divididos.',
    efectos_adversos: 'Náuseas, temblor, ganancia de peso, alopecia, trombocitopenia, hepatotoxicidad, pancreatitis, hiperamonemia (encefalopatía).',
    contraindicaciones: 'Hepatopatía, trastornos del ciclo de la urea, embarazo (teratogénico).',
    precauciones_adulto_mayor: 'Pruebas hepáticas y hemograma basales y periódicos. Vigilar confusión (hiperamonemia).',
    interacciones: 'Lamotrigina, fenitoína, carbamazepina, aspirina, anticoagulantes.',
    conservacion: 'Temperatura ambiente.',
  },

  CARBAMAZEPINA: {
    categoria: 'Antiepiléptico y estabilizador del ánimo.',
    indicaciones: 'Epilepsia parcial, neuralgia del trigémino, trastorno bipolar.',
    posologia: 'Adultos: inicio 200 mg cada 12 h, titular hasta 800–1200 mg/día.',
    efectos_adversos: 'Mareo, diplopía, ataxia, hiponatremia, leucopenia, rash (riesgo Stevens-Johnson, mayor en asiáticos HLA-B*1502).',
    contraindicaciones: 'Bloqueo AV, depresión medular.',
    precauciones_adulto_mayor: 'Hemograma y sodio basales y periódicos. Inductor potente CYP3A4.',
    interacciones: 'MUCHAS: anticonceptivos, warfarina, simvastatina, claritromicina, fluoxetina. Reduce eficacia de muchos fármacos.',
    conservacion: 'Temperatura ambiente, protegido de humedad.',
  },

  DUTASTERIDA: {
    categoria: 'Inhibidor 5-alfa-reductasa.',
    indicaciones: 'Hiperplasia prostática benigna.',
    posologia: 'Adultos: 0,5 mg/día.',
    efectos_adversos: 'Disfunción eréctil, disminución de libido, ginecomastia. Reduce PSA a la mitad (interpretar exámenes).',
    contraindicaciones: 'Mujeres y niños. No manipular cápsulas si embarazadas (teratogénico por contacto).',
    precauciones_adulto_mayor: 'Informar al médico que toma este fármaco para interpretar PSA correctamente.',
    interacciones: 'Inhibidores potentes CYP3A4 (ritonavir, ketoconazol).',
    conservacion: 'Temperatura ambiente.',
  },

  FINASTERIDA: {
    categoria: 'Inhibidor 5-alfa-reductasa tipo II.',
    indicaciones: 'HPB (5 mg), alopecia androgénica (1 mg).',
    posologia: 'HPB: 5 mg/día. Alopecia: 1 mg/día.',
    efectos_adversos: 'Disfunción eréctil, disminución de libido, ginecomastia. Reduce PSA a la mitad.',
    contraindicaciones: 'Mujeres en edad fértil (teratogénico). No donar sangre.',
    precauciones_adulto_mayor: 'Informar al médico para interpretar PSA.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  TIMOLOL: {
    categoria: 'Betabloqueante. Vía oftálmica para glaucoma.',
    indicaciones: 'Glaucoma de ángulo abierto, hipertensión ocular.',
    posologia: 'Colirio: 1 gota cada 12 h (o 1/día si es de liberación prolongada).',
    efectos_adversos: 'Locales: irritación. Sistémicos (por absorción): bradicardia, broncoespasmo, fatiga.',
    contraindicaciones: 'Asma, EPOC severa, bradicardia, bloqueo AV, insuficiencia cardíaca.',
    precauciones_adulto_mayor: 'Aplicar y luego presionar canto interno del ojo 1 min para reducir absorción sistémica. Vigilar frecuencia cardíaca.',
    interacciones: 'Verapamilo, diltiazem, antiarrítmicos.',
    conservacion: 'Temperatura ambiente.',
  },

  CARBOXIMETILCELULOSA: {
    categoria: 'Lubricante oftálmico (lágrimas artificiales).',
    indicaciones: 'Síndrome de ojo seco, irritación ocular.',
    posologia: '1 gota en cada ojo 3–6 veces al día o según necesidad.',
    efectos_adversos: 'Visión borrosa transitoria, irritación leve.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Preferir presentación sin preservantes para uso crónico/frecuente.',
    interacciones: 'Separar 10 min de otros colirios.',
    conservacion: 'Temperatura ambiente.',
  },

  CLORHEXIDINA: {
    categoria: 'Antiséptico de amplio espectro.',
    indicaciones: 'Antisepsia cutánea, lavado de manos quirúrgico, enjuague bucal (gingivitis, post-cirugía dental).',
    posologia: 'Enjuague bucal 0,12%: 10 ml por 30 segundos, 2 veces al día, máximo 2 semanas.',
    efectos_adversos: 'Tinción reversible de dientes con uso prolongado, alteración del gusto, irritación de mucosas.',
    contraindicaciones: 'Hipersensibilidad. No usar en oído medio o meninges.',
    precauciones_adulto_mayor: 'Útil en gingivitis y limpieza de prótesis. No exceder 2 semanas continuas para evitar tinción y disbiosis.',
    interacciones: 'Pasta de dientes con SLS (separar 30 min — reducen efecto).',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Anticonceptivos / hormonales ─────────
  ETINILESTRADIOL: {
    categoria: 'Estrógeno sintético. Componente de anticonceptivos hormonales combinados.',
    indicaciones: 'Anticoncepción combinada (con progestágeno). Trastornos menstruales seleccionados.',
    posologia: '20–35 mcg/día como parte de píldora combinada, según indicación ginecológica.',
    efectos_adversos: 'Náuseas, sensibilidad mamaria, cefalea, sangrado intermenstrual, cambios del ánimo, retención de líquidos. Riesgo trombótico (TVP, TEP, ACV, IAM), mayor con tabaco y >35 años.',
    contraindicaciones: 'Antecedente de tromboembolismo, cáncer hormono-dependiente, hepatopatía severa, migraña con aura, hipertensión no controlada, tabaquismo en >35 años, embarazo.',
    precauciones_adulto_mayor: 'No se utiliza con fines anticonceptivos en adulto mayor. Para terapia hormonal de la menopausia se prefieren estrógenos a dosis más bajas con evaluación riesgo/beneficio.',
    interacciones: 'Inductores enzimáticos (rifampicina, carbamazepina, fenitoína, hipérico) reducen eficacia. Algunos antibióticos.',
    conservacion: 'Temperatura ambiente, protegido de la luz.',
  },

  LEVONORGESTREL: {
    categoria: 'Progestágeno sintético.',
    indicaciones: 'Anticoncepción combinada o de progestágeno solo. Anticoncepción de emergencia (1,5 mg dosis única).',
    posologia: 'Píldora diaria según envase. Emergencia: 1,5 mg lo antes posible (hasta 72 h post-coito).',
    efectos_adversos: 'Náuseas, cefalea, sangrado irregular, sensibilidad mamaria, fatiga.',
    contraindicaciones: 'Embarazo confirmado, sangrado vaginal sin diagnóstico, cáncer hormono-dependiente.',
    precauciones_adulto_mayor: 'Sin uso anticonceptivo en adulto mayor.',
    interacciones: 'Inductores enzimáticos (rifampicina, anticonvulsivantes, hipérico) reducen eficacia.',
    conservacion: 'Temperatura ambiente.',
  },

  DIENOGEST: {
    categoria: 'Progestágeno sintético con efecto antiandrogénico.',
    indicaciones: 'Anticoncepción combinada. Endometriosis (2 mg/día).',
    posologia: 'Endometriosis: 2 mg/día continuo. Anticoncepción: según píldora combinada.',
    efectos_adversos: 'Sangrado irregular, cefalea, acné, sensibilidad mamaria, cambios de ánimo.',
    contraindicaciones: 'Tromboembolismo, hepatopatía severa, cáncer hormono-dependiente, embarazo.',
    precauciones_adulto_mayor: 'Sin indicación habitual en adulto mayor.',
    interacciones: 'Inductores CYP3A4.',
    conservacion: 'Temperatura ambiente.',
  },

  DROSPIRENONA: {
    categoria: 'Progestágeno con actividad antimineralocorticoide y antiandrogénica.',
    indicaciones: 'Anticoncepción combinada (con etinilestradiol).',
    posologia: 'Según píldora (3 mg/día como parte de la combinación).',
    efectos_adversos: 'Hiperpotasemia (atención si hay falla renal o uso de IECA/ARA II), sensibilidad mamaria, cefalea.',
    contraindicaciones: 'Insuficiencia renal, hepatopatía, suprarrenal, riesgo trombótico aumentado.',
    precauciones_adulto_mayor: 'No de uso habitual en adulto mayor.',
    interacciones: 'IECA, ARA II, espironolactona, AINEs (hiperkalemia).',
    conservacion: 'Temperatura ambiente.',
  },

  GESTODENO: {
    categoria: 'Progestágeno de tercera generación.',
    indicaciones: 'Anticoncepción combinada.',
    posologia: 'Según envase (75 mcg/día como parte de la combinación).',
    efectos_adversos: 'Sangrado intermenstrual, cefalea, sensibilidad mamaria. Riesgo trombótico algo mayor que con levonorgestrel.',
    contraindicaciones: 'Tromboembolismo, hepatopatía severa, cáncer hormono-dependiente, embarazo.',
    precauciones_adulto_mayor: 'No indicado.',
    interacciones: 'Inductores enzimáticos.',
    conservacion: 'Temperatura ambiente.',
  },

  DESOGESTREL: {
    categoria: 'Progestágeno de tercera generación.',
    indicaciones: 'Anticoncepción de progestágeno solo (75 mcg/día) o combinada.',
    posologia: '75 mcg/día sin descanso (toma a la misma hora).',
    efectos_adversos: 'Sangrado irregular, amenorrea, acné, cefalea, sensibilidad mamaria.',
    contraindicaciones: 'Tromboembolismo activo, hepatopatía severa, cáncer hormono-dependiente, embarazo.',
    precauciones_adulto_mayor: 'No indicado.',
    interacciones: 'Inductores enzimáticos.',
    conservacion: 'Temperatura ambiente.',
  },

  MEDROXIPROGESTERONA: {
    categoria: 'Progestágeno.',
    indicaciones: 'Trastornos menstruales, anticoncepción inyectable, terapia hormonal de la menopausia (con estrógeno), endometriosis.',
    posologia: 'Variable según indicación. Inyectable: 150 mg IM cada 3 meses.',
    efectos_adversos: 'Sangrado irregular, aumento de peso, sensibilidad mamaria, disminución de densidad ósea con uso prolongado.',
    contraindicaciones: 'Tromboembolismo, hepatopatía severa, cáncer mama, sangrado sin diagnóstico, embarazo.',
    precauciones_adulto_mayor: 'En terapia hormonal de menopausia, usar la dosis efectiva más baja y el menor tiempo posible.',
    interacciones: 'Inductores enzimáticos.',
    conservacion: 'Temperatura ambiente.',
  },

  ESTRADIOL: {
    categoria: 'Estrógeno natural (17-beta-estradiol). Terapia hormonal de la menopausia.',
    indicaciones: 'Síntomas vasomotores y atrofia urogenital de la menopausia. Hipoestrogenismo.',
    posologia: 'Oral 1–2 mg/día; parche 25–100 mcg/24 h; gel/óvulos vaginales según indicación. Asociar progestágeno si hay útero.',
    efectos_adversos: 'Sensibilidad mamaria, cefalea, sangrado, náuseas. Riesgo trombótico y de cáncer de mama con uso prolongado.',
    contraindicaciones: 'Cáncer de mama o endometrio, tromboembolismo, hepatopatía severa, sangrado vaginal sin diagnóstico.',
    precauciones_adulto_mayor: 'Evitar inicio después de los 60 años o más de 10 años desde la menopausia (mayor riesgo CV). Vía vaginal a dosis bajas es la más segura para síntomas locales.',
    interacciones: 'Inductores enzimáticos, anticoagulantes, tamoxifeno.',
    conservacion: 'Temperatura ambiente.',
  },

  ESTRIOL: {
    categoria: 'Estrógeno débil de uso predominantemente vaginal.',
    indicaciones: 'Atrofia vaginal, sequedad e infecciones urinarias recurrentes asociadas a hipoestrogenismo postmenopáusico.',
    posologia: 'Óvulos/crema vaginal 0,5–1 mg/día por 2–3 semanas, luego 2 veces por semana de mantenimiento.',
    efectos_adversos: 'Irritación local, prurito, sangrado leve.',
    contraindicaciones: 'Cáncer mama o endometrio, sangrado vaginal no diagnosticado, tromboembolismo activo.',
    precauciones_adulto_mayor: 'Vía vaginal a dosis bajas es segura y útil para incontinencia, sequedad e ITU recurrentes en mujer mayor.',
    interacciones: 'Mínimas por baja absorción sistémica.',
    conservacion: 'Temperatura ambiente.',
  },

  PROGESTERONA: {
    categoria: 'Progestágeno natural micronizado.',
    indicaciones: 'Terapia hormonal de menopausia (protección endometrial), insuficiencia lútea, amenorrea secundaria.',
    posologia: 'Oral 100–200 mg/noche; vaginal según indicación.',
    efectos_adversos: 'Somnolencia (toma nocturna), sensibilidad mamaria, sangrado.',
    contraindicaciones: 'Tromboembolismo, sangrado vaginal sin diagnóstico, hepatopatía severa.',
    precauciones_adulto_mayor: 'Tomar antes de dormir por la somnolencia que provoca. Vigilar caídas.',
    interacciones: 'Inductores enzimáticos.',
    conservacion: 'Temperatura ambiente.',
  },

  DIDROGESTERONA: {
    categoria: 'Progestágeno selectivo.',
    indicaciones: 'Insuficiencia lútea, amenorrea, terapia hormonal de menopausia.',
    posologia: '10–20 mg/día según indicación.',
    efectos_adversos: 'Cefalea, sensibilidad mamaria, náuseas.',
    contraindicaciones: 'Cáncer hormono-dependiente, sangrado vaginal no diagnosticado, hepatopatía.',
    precauciones_adulto_mayor: 'Uso en menopausia con vigilancia.',
    interacciones: 'Inductores enzimáticos.',
    conservacion: 'Temperatura ambiente.',
  },

  TIBOLONA: {
    categoria: 'Esteroide sintético con actividad estrogénica, progestagénica y androgénica leve.',
    indicaciones: 'Síntomas climatéricos y prevención de osteoporosis postmenopáusica.',
    posologia: '2,5 mg/día.',
    efectos_adversos: 'Sangrado vaginal, ganancia de peso, sensibilidad mamaria, aumento de riesgo de ACV en >60 años y de recidiva de cáncer de mama.',
    contraindicaciones: 'Cáncer de mama o estrógeno-dependiente, tromboembolismo, ACV o cardiopatía isquémica previa, hepatopatía.',
    precauciones_adulto_mayor: 'No iniciar después de los 60 años por mayor riesgo de ACV. Reevaluar anualmente.',
    interacciones: 'Anticoagulantes (potencia efecto), inductores enzimáticos.',
    conservacion: 'Temperatura ambiente.',
  },

  TESTOSTERONA: {
    categoria: 'Hormona androgénica.',
    indicaciones: 'Hipogonadismo masculino confirmado.',
    posologia: 'Variable según presentación (gel, inyectable). Bajo indicación médica.',
    efectos_adversos: 'Acné, ginecomastia, poliglobulia, retención de líquidos, agravación de HPB, riesgo cardiovascular y trombótico.',
    contraindicaciones: 'Cáncer de próstata o de mama, poliglobulia, IC severa.',
    precauciones_adulto_mayor: 'Controlar hematocrito, PSA y síntomas urinarios. No usar para "antienvejecimiento".',
    interacciones: 'Anticoagulantes, insulina (aumenta sensibilidad), corticoides.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Antiácidos / GI ─────────
  ALGINATO: {
    categoria: 'Antiácido formador de barrera (gel flotante sobre el contenido gástrico).',
    indicaciones: 'Reflujo gastroesofágico, pirosis, regurgitación. Suele combinarse con bicarbonato y carbonato de calcio.',
    posologia: 'Adultos: 10–20 ml o 1–2 sobres después de las comidas y al acostarse.',
    efectos_adversos: 'Distensión, eructos. Aporta sodio (cautela en hipertensión o IC).',
    contraindicaciones: 'Hipersensibilidad. Dieta hiposódica estricta (formulaciones con sodio).',
    precauciones_adulto_mayor: 'Útil y seguro, especialmente para síntomas nocturnos. Tomar tras la cena. Vigilar contenido de sodio.',
    interacciones: 'Reduce absorción de levotiroxina, quinolonas, tetraciclinas, hierro (separar 2 h).',
    conservacion: 'Temperatura ambiente. Agitar antes de usar.',
  },

  'BICARBONATO DE SODIO': {
    categoria: 'Antiácido sistémico y alcalinizante urinario.',
    indicaciones: 'Acidez ocasional, alcalinización urinaria. Uso doméstico también como antiséptico bucal suave.',
    posologia: 'Antiácido: 1/2 cucharadita en agua, ocasional. No usar de forma regular.',
    efectos_adversos: 'Alcalosis, retención de sodio, distensión por gas.',
    contraindicaciones: 'Insuficiencia cardíaca, hipertensión, falla renal, dieta hiposódica.',
    precauciones_adulto_mayor: 'EVITAR uso regular en adulto mayor con hipertensión, IC o falla renal por sobrecarga de sodio. Preferir otros antiácidos.',
    interacciones: 'Reduce absorción de quinolonas, tetraciclinas, hierro, levotiroxina, ketoconazol. Aumenta efecto de simpaticomiméticos.',
    conservacion: 'Temperatura ambiente, seco.',
  },

  'CARBONATO DE CALCIO': {
    categoria: 'Antiácido y suplemento de calcio.',
    indicaciones: 'Acidez/pirosis. Aporte de calcio (osteoporosis, hipocalcemia).',
    posologia: 'Antiácido: 500–1500 mg según necesidad. Suplemento: 500–1000 mg de calcio elemental al día con vitamina D, dividido.',
    efectos_adversos: 'Estreñimiento, distensión, eructos. Hipercalcemia con uso excesivo.',
    contraindicaciones: 'Hipercalcemia, hipercalciuria, cálculos renales de calcio.',
    precauciones_adulto_mayor: 'Útil para acidez y aporte de calcio. Tomar con comidas para mejor absorción. Vigilar estreñimiento.',
    interacciones: 'Reduce absorción de levotiroxina, quinolonas, tetraciclinas, hierro, bifosfonatos (separar 2 h). Tiazidas aumentan calcemia.',
    conservacion: 'Temperatura ambiente, seco.',
  },

  'ALUMINIO HIDROXIDO': {
    categoria: 'Antiácido no sistémico.',
    indicaciones: 'Acidez, pirosis. Hiperfosfatemia en falla renal.',
    posologia: '500–1500 mg después de comidas y al acostarse.',
    efectos_adversos: 'Estreñimiento. Acumulación de aluminio en falla renal (riesgo neurológico).',
    contraindicaciones: 'Falla renal severa (uso prolongado).',
    precauciones_adulto_mayor: 'Vigilar estreñimiento. Combinaciones con magnesio mejoran tolerancia. Evitar uso prolongado.',
    interacciones: 'Reduce absorción de quinolonas, tetraciclinas, hierro, levotiroxina, digoxina (separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  'MAGNESIO HIDROXIDO': {
    categoria: 'Antiácido y laxante osmótico.',
    indicaciones: 'Acidez, pirosis. Estreñimiento ocasional.',
    posologia: 'Antiácido: 400–800 mg tras comidas. Laxante: 2,4–4,8 g al acostarse.',
    efectos_adversos: 'Diarrea, calambres. Hipermagnesemia en falla renal.',
    contraindicaciones: 'Falla renal moderada a severa, obstrucción intestinal.',
    precauciones_adulto_mayor: 'EVITAR en falla renal por riesgo de hipermagnesemia. Vigilar diarrea.',
    interacciones: 'Reduce absorción de varios fármacos (separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  SUCRALFATO: {
    categoria: 'Citoprotector gástrico (complejo de sacarosa y aluminio).',
    indicaciones: 'Úlcera gastroduodenal, esofagitis, mucositis.',
    posologia: '1 g 4 veces/día, 1 h antes de comidas y al acostarse, estómago vacío.',
    efectos_adversos: 'Estreñimiento. Acumulación de aluminio en falla renal.',
    contraindicaciones: 'Falla renal severa.',
    precauciones_adulto_mayor: 'Útil en úlcera. Vigilar estreñimiento y función renal.',
    interacciones: 'Reduce absorción de quinolonas, levotiroxina, digoxina, fenitoína, warfarina (separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  LANSOPRAZOL: {
    categoria: 'Inhibidor de bomba de protones (IBP).',
    indicaciones: 'ERGE, úlcera, gastritis, profilaxis con AINEs, H. pylori.',
    posologia: '15–30 mg/día, 30 min antes del desayuno.',
    efectos_adversos: 'Cefalea, diarrea, dolor abdominal. Uso prolongado: déficit de B12, magnesio, fracturas, neumonía, C. difficile.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Mismas cautelas que omeprazol: dosis efectiva más baja, reevaluar continuidad. Vigilar magnesio y B12.',
    interacciones: 'Reduce absorción de ketoconazol, atazanavir, hierro. Clopidogrel (menor interacción que omeprazol).',
    conservacion: 'Temperatura ambiente.',
  },

  LOPERAMIDA: {
    categoria: 'Antidiarreico opioide periférico.',
    indicaciones: 'Diarrea aguda no infecciosa y diarrea crónica funcional.',
    posologia: 'Adultos: 4 mg inicial, luego 2 mg tras cada deposición. Máximo 16 mg/día.',
    efectos_adversos: 'Estreñimiento, dolor abdominal, somnolencia. Dosis altas: arritmias (prolongación QT).',
    contraindicaciones: 'Diarrea con fiebre o sangre, colitis pseudomembranosa, megacolon, niños <2 años.',
    precauciones_adulto_mayor: 'Vigilar deshidratación e íleo. No usar más de 48 h sin diagnóstico.',
    interacciones: 'Inhibidores CYP3A4 y P-glicoproteína (quinidina, ritonavir) aumentan niveles.',
    conservacion: 'Temperatura ambiente.',
  },

  ONDANSETRON: {
    categoria: 'Antiemético antagonista 5-HT3.',
    indicaciones: 'Náuseas y vómitos por quimioterapia, radioterapia, postoperatorio, gastroenteritis.',
    posologia: 'Adultos: 4–8 mg cada 8–12 h vía oral o IV.',
    efectos_adversos: 'Cefalea, estreñimiento, prolongación QT.',
    contraindicaciones: 'Síndrome de QT largo, hipersensibilidad.',
    precauciones_adulto_mayor: 'Vigilar QT (ECG si hay otros prolongadores). Estreñimiento frecuente.',
    interacciones: 'Otros prolongadores de QT (amiodarona, claritromicina, citalopram, metadona). Tramadol (riesgo serotoninérgico).',
    conservacion: 'Temperatura ambiente.',
  },

  METOCLOPRAMIDA: {
    categoria: 'Antiemético procinético (antidopaminérgico).',
    indicaciones: 'Náuseas, vómitos, reflujo, gastroparesia.',
    posologia: 'Adultos: 10 mg hasta 3 veces/día por máximo 5 días.',
    efectos_adversos: 'Somnolencia, inquietud, síntomas extrapiramidales, discinesia tardía con uso prolongado.',
    contraindicaciones: 'Parkinson, obstrucción/perforación/hemorragia gastrointestinal, feocromocitoma.',
    precauciones_adulto_mayor: 'EVITAR uso prolongado (criterios Beers) por riesgo de extrapiramidalismo y discinesia tardía. Limitar a ≤5 días.',
    interacciones: 'Antipsicóticos (potencia extrapiramidalismo), levodopa (antagonismo), depresores SNC.',
    conservacion: 'Temperatura ambiente.',
  },

  TRIMEBUTINO: {
    categoria: 'Regulador de la motilidad intestinal.',
    indicaciones: 'Síndrome de intestino irritable, trastornos funcionales digestivos.',
    posologia: '100–200 mg 3 veces/día antes de comidas.',
    efectos_adversos: 'Boca seca, somnolencia leve, náuseas.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Buena tolerancia. Útil cuando hay alternancia diarrea/estreñimiento.',
    interacciones: 'Pocas conocidas.',
    conservacion: 'Temperatura ambiente.',
  },

  MEBEVERINA: {
    categoria: 'Antiespasmódico musculotrópico.',
    indicaciones: 'Síndrome de intestino irritable, espasmo intestinal.',
    posologia: '135 mg 3 veces/día, 20 min antes de comidas, o retard 200 mg cada 12 h.',
    efectos_adversos: 'Mareo, cefalea, reacciones alérgicas leves.',
    contraindicaciones: 'Íleo paralítico.',
    precauciones_adulto_mayor: 'Buen perfil en adulto mayor (sin efectos anticolinérgicos significativos).',
    interacciones: 'Pocas.',
    conservacion: 'Temperatura ambiente.',
  },

  ESCOPOLAMINA: {
    categoria: 'Antiespasmódico anticolinérgico (butilbromuro).',
    indicaciones: 'Cólicos viscerales (renales, biliares, digestivos), dismenorrea.',
    posologia: '10–20 mg hasta 4 veces/día. Inyectable según indicación.',
    efectos_adversos: 'Boca seca, visión borrosa, retención urinaria, taquicardia, estreñimiento.',
    contraindicaciones: 'Glaucoma de ángulo estrecho, hipertrofia prostática, miastenia, taquiarritmias, obstrucción intestinal.',
    precauciones_adulto_mayor: 'EVITAR si es posible (criterios Beers — carga anticolinérgica): caídas, confusión, retención urinaria, estreñimiento. Usar sólo episodios agudos.',
    interacciones: 'Otros anticolinérgicos (antihistamínicos, antidepresivos tricíclicos, antipsicóticos).',
    conservacion: 'Temperatura ambiente.',
  },

  'PICOSULFATO DE SODIO': {
    categoria: 'Laxante estimulante.',
    indicaciones: 'Estreñimiento ocasional, preparación colonoscopia.',
    posologia: '5–10 mg/noche.',
    efectos_adversos: 'Cólicos, diarrea, deshidratación, hipopotasemia con uso prolongado.',
    contraindicaciones: 'Obstrucción intestinal, abdomen agudo.',
    precauciones_adulto_mayor: 'No usar más de 1 semana sin evaluación. Preferir laxantes osmóticos (macrogol, lactulosa) para uso crónico.',
    interacciones: 'Diuréticos, digoxina (hipopotasemia).',
    conservacion: 'Temperatura ambiente.',
  },

  'CASSIA ANGUSTIFOLIA': {
    categoria: 'Laxante estimulante natural (sen, sennósidos).',
    indicaciones: 'Estreñimiento ocasional.',
    posologia: 'Sennósidos: 12–24 mg/noche. No usar más de 1–2 semanas.',
    efectos_adversos: 'Cólicos, diarrea, melanosis coli con uso crónico, hipopotasemia.',
    contraindicaciones: 'Obstrucción intestinal, abdomen agudo, embarazo, lactancia.',
    precauciones_adulto_mayor: 'Útil ocasionalmente. EVITAR uso crónico — preferir fibra/macrogol/lactulosa.',
    interacciones: 'Diuréticos, digoxina, corticoides (hipopotasemia).',
    conservacion: 'Temperatura ambiente.',
  },

  DIFENIDOL: {
    categoria: 'Antiemético antivertiginoso.',
    indicaciones: 'Vértigo, mareo, náuseas y vómitos.',
    posologia: '25–50 mg cada 4–6 h. Máximo 200 mg/día.',
    efectos_adversos: 'Somnolencia, boca seca, visión borrosa, hipotensión.',
    contraindicaciones: 'Glaucoma de ángulo estrecho, obstrucción urinaria, embarazo (1er trimestre).',
    precauciones_adulto_mayor: 'Cautela por carga anticolinérgica y riesgo de caídas. Preferir betahistina si predomina vértigo.',
    interacciones: 'Depresores SNC, anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  DIMENHIDRINATO: {
    categoria: 'Antihistamínico H1 con efecto antiemético/antivertiginoso.',
    indicaciones: 'Cinetosis, náuseas y vómitos, vértigo.',
    posologia: '50–100 mg cada 4–6 h. Máximo 400 mg/día.',
    efectos_adversos: 'Somnolencia, boca seca, retención urinaria, visión borrosa.',
    contraindicaciones: 'Glaucoma de ángulo estrecho, hipertrofia prostática, asma severa.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): anticolinérgico, sedación, caídas, confusión. Usar sólo dosis única si es indispensable.',
    interacciones: 'Depresores SNC, otros anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  RACECADOTRILO: {
    categoria: 'Antidiarreico antisecretor (inhibidor de encefalinasa).',
    indicaciones: 'Diarrea aguda en adultos y niños.',
    posologia: 'Adultos: 100 mg 3 veces/día con comidas, máximo 7 días.',
    efectos_adversos: 'Cefalea, somnolencia, rash.',
    contraindicaciones: 'Hipersensibilidad. Insuficiencia renal o hepática.',
    precauciones_adulto_mayor: 'Buena alternativa a loperamida (no causa estreñimiento ni íleo).',
    interacciones: 'IECA (raro: angioedema).',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Cardiovascular / metabólico ─────────
  CIPROFIBRATO: {
    categoria: 'Hipolipemiante fibrato.',
    indicaciones: 'Hipertrigliceridemia, dislipidemia mixta.',
    posologia: '100 mg/día con comida.',
    efectos_adversos: 'Mialgias, miopatía/rabdomiólisis (mayor con estatinas), colelitiasis, elevación de transaminasas.',
    contraindicaciones: 'Insuficiencia renal o hepática severa, colelitiasis, embarazo.',
    precauciones_adulto_mayor: 'Mayor riesgo de miopatía. Vigilar CK y función renal. Cautela al combinar con estatinas.',
    interacciones: 'Estatinas (riesgo de rabdomiólisis), warfarina (aumenta INR), sulfonilureas.',
    conservacion: 'Temperatura ambiente.',
  },

  FENOFIBRATO: {
    categoria: 'Hipolipemiante fibrato.',
    indicaciones: 'Hipertrigliceridemia, dislipidemia mixta.',
    posologia: '145–200 mg/día con comida.',
    efectos_adversos: 'Mialgias, transaminasas elevadas, dispepsia, colelitiasis.',
    contraindicaciones: 'Falla renal o hepática severa, colelitiasis, embarazo.',
    precauciones_adulto_mayor: 'Ajustar a función renal. Vigilar CK al asociar estatina.',
    interacciones: 'Estatinas, warfarina, ciclosporina.',
    conservacion: 'Temperatura ambiente.',
  },

  LOVASTATINA: {
    categoria: 'Hipolipemiante (inhibidor HMG-CoA reductasa).',
    indicaciones: 'Hipercolesterolemia, prevención CV.',
    posologia: '20–80 mg/noche con comida.',
    efectos_adversos: 'Mialgias, transaminasas elevadas, miopatía. Diabetes de novo (riesgo bajo).',
    contraindicaciones: 'Hepatopatía activa, embarazo.',
    precauciones_adulto_mayor: 'Útil en prevención CV. Vigilar mialgias y CK. Empezar con dosis bajas.',
    interacciones: 'CYP3A4 (claritromicina, amiodarona, jugo de pomelo) aumentan toxicidad. Fibratos.',
    conservacion: 'Temperatura ambiente.',
  },

  ROSUVASTATINA: {
    categoria: 'Estatina de alta potencia.',
    indicaciones: 'Hipercolesterolemia, prevención CV primaria y secundaria.',
    posologia: '5–40 mg/día (preferible al acostarse).',
    efectos_adversos: 'Mialgias, transaminasas elevadas, proteinuria leve a dosis altas, diabetes de novo.',
    contraindicaciones: 'Hepatopatía activa, embarazo, falla renal severa.',
    precauciones_adulto_mayor: 'Iniciar con 5–10 mg. Vigilar mialgias. Población asiática: empezar bajo.',
    interacciones: 'Ciclosporina, gemfibrozilo (evitar combinación), warfarina.',
    conservacion: 'Temperatura ambiente.',
  },

  CAPTOPRIL: {
    categoria: 'IECA de acción corta.',
    indicaciones: 'Hipertensión, insuficiencia cardíaca, nefropatía diabética.',
    posologia: 'Adultos: 12,5–50 mg 2–3 veces/día. Tomar 1 h antes de comidas.',
    efectos_adversos: 'Tos seca, hipotensión, hiperpotasemia, angioedema, alteración del gusto, falla renal aguda.',
    contraindicaciones: 'Angioedema previo a IECA, estenosis bilateral arteria renal, embarazo.',
    precauciones_adulto_mayor: 'Iniciar dosis baja, vigilar hipotensión postural, función renal y potasio.',
    interacciones: 'AINEs (reducen efecto, riesgo renal), diuréticos ahorradores K, litio.',
    conservacion: 'Temperatura ambiente.',
  },

  METILDOPA: {
    categoria: 'Antihipertensivo de acción central.',
    indicaciones: 'Hipertensión, especialmente del embarazo.',
    posologia: '250–500 mg 2–3 veces/día. Máximo 3 g/día.',
    efectos_adversos: 'Somnolencia, hipotensión postural, hepatitis, anemia hemolítica (Coombs+), depresión.',
    contraindicaciones: 'Hepatopatía activa, depresión grave, feocromocitoma.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): sedación, hipotensión ortostática, depresión. Usar sólo si no hay alternativa.',
    interacciones: 'IMAOs, simpaticomiméticos, litio, hierro (reduce absorción).',
    conservacion: 'Temperatura ambiente.',
  },

  HIDRALAZINA: {
    categoria: 'Vasodilatador directo.',
    indicaciones: 'Hipertensión, insuficiencia cardíaca (con nitratos).',
    posologia: '25–100 mg 2–4 veces/día.',
    efectos_adversos: 'Taquicardia refleja, cefalea, sofocos, lupus inducido (dosis altas, prolongado).',
    contraindicaciones: 'Cardiopatía isquémica grave, taquicardia, lupus.',
    precauciones_adulto_mayor: 'Vigilar hipotensión y taquicardia. Útil en IC con función renal limítrofe.',
    interacciones: 'Antihipertensivos (potencia), AINEs (antagonizan).',
    conservacion: 'Temperatura ambiente.',
  },

  NIFEDIPINO: {
    categoria: 'Antagonista del calcio dihidropiridínico.',
    indicaciones: 'Hipertensión, angina, Raynaud. Preferir formulación retard.',
    posologia: 'Retard 30–90 mg/día.',
    efectos_adversos: 'Edema maleolar, cefalea, sofocos, taquicardia refleja.',
    contraindicaciones: 'Hipotensión, IAM reciente, angina inestable (liberación rápida).',
    precauciones_adulto_mayor: 'EVITAR nifedipino de liberación inmediata (criterios Beers). Las formas retard son aceptables; vigilar edema.',
    interacciones: 'Inhibidores CYP3A4 (claritromicina, jugo de pomelo), betabloqueantes.',
    conservacion: 'Temperatura ambiente, protegido de la luz.',
  },

  ESPIRONOLACTONA: {
    categoria: 'Diurético ahorrador de potasio, antagonista de aldosterona.',
    indicaciones: 'IC con fracción de eyección reducida, hipertensión resistente, cirrosis con ascitis, hiperaldosteronismo, acné/hirsutismo.',
    posologia: '25–100 mg/día.',
    efectos_adversos: 'Hiperpotasemia, ginecomastia, irregularidad menstrual, AKI.',
    contraindicaciones: 'Hiperpotasemia, falla renal severa, Addison, embarazo.',
    precauciones_adulto_mayor: 'Vigilar potasio y creatinina al inicio y tras cambios de dosis. Cautela al asociar con IECA/ARA II.',
    interacciones: 'IECA/ARA II, AINEs, suplementos de potasio (hiperkalemia). Digoxina (aumenta niveles).',
    conservacion: 'Temperatura ambiente.',
  },

  FUROSEMIDA: {
    categoria: 'Diurético de asa.',
    indicaciones: 'Edema (IC, hepatopatía, renal), hipertensión refractaria.',
    posologia: '20–80 mg/día oral.',
    efectos_adversos: 'Hipopotasemia, hiponatremia, deshidratación, ototoxicidad (dosis altas IV), gota, hiperglicemia.',
    contraindicaciones: 'Anuria, deshidratación severa, hipopotasemia no corregida.',
    precauciones_adulto_mayor: 'Riesgo de caídas por hipotensión, deshidratación e hiponatremia. Controlar electrólitos y función renal.',
    interacciones: 'Aminoglucósidos (ototoxicidad), litio, digoxina, AINEs.',
    conservacion: 'Temperatura ambiente, protegido de la luz.',
  },

  DIGOXINA: {
    categoria: 'Glucósido cardíaco.',
    indicaciones: 'Fibrilación auricular (control de frecuencia), insuficiencia cardíaca.',
    posologia: '0,125–0,25 mg/día. Ajustar a función renal y peso.',
    efectos_adversos: 'Náuseas, anorexia, alteraciones visuales (amarillo/verde), arritmias, bloqueo AV. Margen terapéutico estrecho.',
    contraindicaciones: 'Bloqueo AV, taquicardia ventricular, WPW.',
    precauciones_adulto_mayor: 'EVITAR >0,125 mg/día (criterios Beers). Vigilar digoxinemia, función renal, potasio y magnesio.',
    interacciones: 'Amiodarona, verapamilo, claritromicina, diuréticos (hipokalemia potencia toxicidad).',
    conservacion: 'Temperatura ambiente.',
  },

  NEBIVOLOL: {
    categoria: 'Betabloqueante beta1-selectivo con efecto vasodilatador (NO).',
    indicaciones: 'Hipertensión, insuficiencia cardíaca en adulto mayor.',
    posologia: '2,5–10 mg/día.',
    efectos_adversos: 'Fatiga, mareo, bradicardia, cefalea.',
    contraindicaciones: 'Bradicardia, bloqueo AV, asma severa, IC descompensada.',
    precauciones_adulto_mayor: 'Bien tolerado. Iniciar 2,5 mg. Vigilar frecuencia cardíaca y presión.',
    interacciones: 'Verapamilo, diltiazem, antiarrítmicos.',
    conservacion: 'Temperatura ambiente.',
  },

  BETAXOLOL: {
    categoria: 'Betabloqueante beta1-selectivo.',
    indicaciones: 'Hipertensión (oral); glaucoma de ángulo abierto (colirio).',
    posologia: 'Colirio: 1 gota cada 12 h. Oral: 10–20 mg/día.',
    efectos_adversos: 'Locales (colirio): irritación. Sistémicos: bradicardia, broncoespasmo (menor que timolol).',
    contraindicaciones: 'Bradicardia, bloqueo AV, asma severa, IC descompensada.',
    precauciones_adulto_mayor: 'Alternativa más segura que timolol en EPOC/asma leve. Igual presionar canto interno tras gota.',
    interacciones: 'Verapamilo, diltiazem, antiarrítmicos.',
    conservacion: 'Temperatura ambiente.',
  },

  DOXAZOSINA: {
    categoria: 'Alfabloqueante.',
    indicaciones: 'Hiperplasia prostática benigna (síntomas urinarios), hipertensión (segunda línea).',
    posologia: 'Inicio 1 mg/noche, titular hasta 4–8 mg/día.',
    efectos_adversos: 'Hipotensión ortostática (especialmente primera dosis), mareo, edema, congestión nasal.',
    contraindicaciones: 'Hipotensión ortostática, antecedente de síncope.',
    precauciones_adulto_mayor: 'EVITAR como antihipertensivo (criterios Beers — caídas). Para HPB: tomar al acostarse, levantarse lento.',
    interacciones: 'Otros antihipertensivos, sildenafil/tadalafil (hipotensión).',
    conservacion: 'Temperatura ambiente.',
  },

  'ISOSORBIDE DINITRATO': {
    categoria: 'Nitrato vasodilatador.',
    indicaciones: 'Angina (profilaxis y crisis), insuficiencia cardíaca.',
    posologia: 'Oral 5–40 mg cada 6–8 h. Sublingual: 2,5–5 mg en crisis. Mantener 8–12 h libres de nitrato.',
    efectos_adversos: 'Cefalea (frecuente al inicio), hipotensión, taquicardia refleja, sofocos.',
    contraindicaciones: 'Hipotensión, IAM con compromiso del VD, uso de sildenafil/tadalafil (riesgo de hipotensión severa).',
    precauciones_adulto_mayor: 'Riesgo de caídas por hipotensión. NO combinar con inhibidores PDE5 (sildenafil/tadalafil) por 24–48 h.',
    interacciones: 'Sildenafil, tadalafil, vardenafil, riociguat, antihipertensivos.',
    conservacion: 'Temperatura ambiente, protegido de la luz.',
  },

  CLOPIDOGREL: {
    categoria: 'Antiagregante plaquetario (inhibidor P2Y12).',
    indicaciones: 'Síndrome coronario agudo, post-stent, ACV isquémico, enfermedad arterial periférica.',
    posologia: '75 mg/día. Dosis carga 300–600 mg en SCA.',
    efectos_adversos: 'Sangrado (digestivo, intracraneal), hematomas, rash, raras citopenias.',
    contraindicaciones: 'Sangrado activo, úlcera activa, hipersensibilidad.',
    precauciones_adulto_mayor: 'Mayor riesgo de sangrado. Considerar IBP gastroprotector. Suspender 5–7 días antes de cirugía mayor.',
    interacciones: 'Omeprazol/esomeprazol reducen activación (preferir pantoprazol). AINEs, anticoagulantes (sangrado).',
    conservacion: 'Temperatura ambiente.',
  },

  RIVAROXABAN: {
    categoria: 'Anticoagulante oral directo (inhibidor del factor Xa).',
    indicaciones: 'FA no valvular, TVP/TEP (tratamiento y prevención), prevención tras cirugía ortopédica.',
    posologia: 'FA: 20 mg/día con comida (15 mg si ClCr 15–49). TVP: 15 mg cada 12 h por 21 días, luego 20 mg/día.',
    efectos_adversos: 'Sangrado (digestivo, intracraneal, urogenital), anemia.',
    contraindicaciones: 'Sangrado activo, lesiones de alto riesgo de sangrado, hepatopatía moderada-severa, embarazo, ClCr <15.',
    precauciones_adulto_mayor: 'Ajustar a función renal. Vigilar sangrado y caídas. NO triturar tabletas (excepto indicado). Tomar con comida.',
    interacciones: 'Inhibidores potentes CYP3A4/P-gp (ketoconazol, ritonavir), inductores (rifampicina, carbamazepina), AINEs, antiagregantes.',
    conservacion: 'Temperatura ambiente.',
  },

  COLCHICINA: {
    categoria: 'Antiinflamatorio específico para gota.',
    indicaciones: 'Crisis gotosa aguda, profilaxis de gota, fiebre mediterránea familiar, pericarditis.',
    posologia: 'Crisis: 1 mg inicial, luego 0,5 mg a la hora (máximo 1,5 mg/día). Profilaxis: 0,5–1 mg/día.',
    efectos_adversos: 'Diarrea, náuseas, mialgia, neuropatía, mielosupresión, rabdomiólisis. Margen terapéutico estrecho.',
    contraindicaciones: 'Falla renal o hepática severa con uso de inhibidores CYP3A4/P-gp, discrasias sanguíneas.',
    precauciones_adulto_mayor: 'Ajustar a función renal. Vigilar mialgia/CK al asociar estatinas. Evitar claritromicina.',
    interacciones: 'Claritromicina, ciclosporina, estatinas, jugo de pomelo (toxicidad severa).',
    conservacion: 'Temperatura ambiente.',
  },

  TRIMETAZIDINA: {
    categoria: 'Antianginoso metabólico.',
    indicaciones: 'Angina estable (segunda línea, complementario).',
    posologia: '20 mg 3 veces/día o 35 mg cada 12 h.',
    efectos_adversos: 'Síntomas parkinsonianos, temblor, mareo, malestar digestivo.',
    contraindicaciones: 'Parkinson, síndromes parkinsonianos, temblor, falla renal severa.',
    precauciones_adulto_mayor: 'Vigilar aparición de temblor o parkinsonismo — suspender si aparecen. Ajustar en falla renal.',
    interacciones: 'Pocas conocidas.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Diabetes ─────────
  DAPAGLIFOZINA: {
    categoria: 'Hipoglicemiante inhibidor SGLT2.',
    indicaciones: 'Diabetes tipo 2, insuficiencia cardíaca, enfermedad renal crónica.',
    posologia: '10 mg/día.',
    efectos_adversos: 'Infecciones genitourinarias, depleción de volumen, cetoacidosis euglicémica (rara), gangrena de Fournier (muy rara).',
    contraindicaciones: 'Diabetes tipo 1, cetoacidosis, falla renal severa.',
    precauciones_adulto_mayor: 'Útil por beneficio CV y renal. Vigilar hidratación e infecciones urogenitales. Suspender en cirugía o enfermedad aguda.',
    interacciones: 'Diuréticos (depleción de volumen), insulina/sulfonilureas (ajustar para evitar hipoglicemia).',
    conservacion: 'Temperatura ambiente.',
  },

  LINAGLIPTINA: {
    categoria: 'Hipoglicemiante inhibidor DPP-4.',
    indicaciones: 'Diabetes tipo 2.',
    posologia: '5 mg/día.',
    efectos_adversos: 'Nasofaringitis, pancreatitis (rara), artralgia, urticaria.',
    contraindicaciones: 'Diabetes tipo 1, cetoacidosis, antecedente pancreatitis.',
    precauciones_adulto_mayor: 'Buena opción: no requiere ajuste renal, bajo riesgo de hipoglicemia.',
    interacciones: 'Inductores CYP3A4 reducen efecto.',
    conservacion: 'Temperatura ambiente.',
  },

  VILDAGLIPTINA: {
    categoria: 'Hipoglicemiante inhibidor DPP-4.',
    indicaciones: 'Diabetes tipo 2.',
    posologia: '50 mg 1–2 veces/día (50 mg/día si falla renal moderada-severa).',
    efectos_adversos: 'Cefalea, mareo, hepatitis (rara — vigilar transaminasas), pancreatitis.',
    contraindicaciones: 'Hepatopatía activa, transaminasas >3x VN.',
    precauciones_adulto_mayor: 'Bajo riesgo de hipoglicemia. Controlar transaminasas basales y a los 3, 6, 12 meses.',
    interacciones: 'Pocas relevantes.',
    conservacion: 'Temperatura ambiente.',
  },

  GLIBENCLAMIDA: {
    categoria: 'Hipoglicemiante sulfonilurea.',
    indicaciones: 'Diabetes tipo 2.',
    posologia: '2,5–15 mg/día con desayuno.',
    efectos_adversos: 'Hipoglicemia (puede ser severa y prolongada), aumento de peso.',
    contraindicaciones: 'Diabetes tipo 1, falla renal o hepática severa, embarazo.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): hipoglicemia prolongada en adulto mayor. Preferir DPP-4, SGLT2 o metformina.',
    interacciones: 'Sulfonamidas, fluconazol, IECA, AINEs (potencian hipoglicemia). Beta-bloqueantes (enmascaran hipoglicemia).',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Psicofármacos / neuro ─────────
  BUPROPION: {
    categoria: 'Antidepresivo inhibidor de recaptación de dopamina/noradrenalina. Cesación tabáquica.',
    indicaciones: 'Depresión mayor, cesación de tabaquismo.',
    posologia: 'Liberación prolongada: 150–300 mg/día por la mañana.',
    efectos_adversos: 'Insomnio, sequedad bucal, cefalea, temblor, hipertensión, riesgo de convulsiones (dosis-dependiente).',
    contraindicaciones: 'Antecedente convulsivo, trastornos alimentarios (bulimia/anorexia), suspensión brusca de alcohol/benzodiacepinas, IMAOs.',
    precauciones_adulto_mayor: 'Bajo riesgo de hipotensión y caídas vs ISRS. Vigilar presión arterial e insomnio.',
    interacciones: 'IMAOs (contraindicado), inhibidores CYP2D6 (metoprolol, tamoxifeno), antipsicóticos (umbral convulsivo).',
    conservacion: 'Temperatura ambiente.',
  },

  MIRTAZAPINA: {
    categoria: 'Antidepresivo tetracíclico (noradrenérgico y serotoninérgico).',
    indicaciones: 'Depresión mayor, especialmente con insomnio o anorexia.',
    posologia: '15–45 mg/noche.',
    efectos_adversos: 'Somnolencia, aumento de apetito y peso, boca seca, neutropenia (rara).',
    contraindicaciones: 'IMAOs, hipersensibilidad.',
    precauciones_adulto_mayor: 'Útil cuando coexiste insomnio o bajo peso. Riesgo de hiponatremia y caídas. Iniciar 7,5–15 mg.',
    interacciones: 'IMAOs, depresores SNC, ISRS (síndrome serotoninérgico raro).',
    conservacion: 'Temperatura ambiente.',
  },

  VENLAFAXINA: {
    categoria: 'Antidepresivo IRSN (serotonina y noradrenalina).',
    indicaciones: 'Depresión mayor, ansiedad generalizada, pánico, ansiedad social.',
    posologia: 'Liberación prolongada: 75–225 mg/día.',
    efectos_adversos: 'Náuseas, insomnio, sudoración, hipertensión dosis-dependiente, disfunción sexual, hiponatremia, síndrome de retiro.',
    contraindicaciones: 'IMAOs, hipersensibilidad, hipertensión no controlada.',
    precauciones_adulto_mayor: 'Vigilar presión arterial, sodio, caídas. Suspender gradualmente.',
    interacciones: 'IMAOs (contraindicado), tramadol, triptanes (síndrome serotoninérgico), warfarina.',
    conservacion: 'Temperatura ambiente.',
  },

  DESVENLAFAXINA: {
    categoria: 'Antidepresivo IRSN (metabolito activo de venlafaxina).',
    indicaciones: 'Depresión mayor.',
    posologia: '50–100 mg/día.',
    efectos_adversos: 'Náuseas, insomnio, mareo, hipertensión, hiponatremia, disfunción sexual.',
    contraindicaciones: 'IMAOs.',
    precauciones_adulto_mayor: 'Similar a venlafaxina. Vigilar presión arterial y sodio.',
    interacciones: 'IMAOs, triptanes, tramadol, AINEs (sangrado).',
    conservacion: 'Temperatura ambiente.',
  },

  CITALOPRAM: {
    categoria: 'Antidepresivo ISRS.',
    indicaciones: 'Depresión, ansiedad, trastorno de pánico.',
    posologia: '20 mg/día (máximo 20 mg en >60 años por prolongación de QT; 40 mg en adultos jóvenes).',
    efectos_adversos: 'Náuseas, insomnio, disfunción sexual, hiponatremia, prolongación de QT.',
    contraindicaciones: 'QT largo, IMAOs, uso concomitante con linezolid.',
    precauciones_adulto_mayor: 'Limitar a 20 mg/día. ECG si hay otros prolongadores de QT. Vigilar sodio.',
    interacciones: 'Otros prolongadores QT (amiodarona, ondansetrón, claritromicina), AINEs (sangrado), tramadol, triptanes.',
    conservacion: 'Temperatura ambiente.',
  },

  IMIPRAMINA: {
    categoria: 'Antidepresivo tricíclico.',
    indicaciones: 'Depresión, dolor neuropático, enuresis nocturna.',
    posologia: '25–150 mg/día.',
    efectos_adversos: 'Boca seca, retención urinaria, estreñimiento, hipotensión ortostática, sedación, prolongación QT, arritmias.',
    contraindicaciones: 'IAM reciente, arritmias, glaucoma de ángulo estrecho, retención urinaria, IMAOs.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): alta carga anticolinérgica, sedación, caídas, arritmias. Preferir ISRS o IRSN.',
    interacciones: 'IMAOs, otros anticolinérgicos, prolongadores QT, depresores SNC.',
    conservacion: 'Temperatura ambiente.',
  },

  TRAZODONA: {
    categoria: 'Antidepresivo atípico, también utilizado por su efecto hipnótico.',
    indicaciones: 'Depresión; insomnio (off-label a dosis bajas).',
    posologia: 'Insomnio: 25–100 mg al acostarse. Depresión: 150–400 mg/día.',
    efectos_adversos: 'Somnolencia, hipotensión ortostática, mareo, sequedad de boca, priapismo (raro).',
    contraindicaciones: 'IAM en fase de recuperación, hipersensibilidad.',
    precauciones_adulto_mayor: 'Útil para insomnio en bajas dosis. Vigilar caídas e hiponatremia. Iniciar 25 mg.',
    interacciones: 'IMAOs, depresores SNC, inhibidores CYP3A4.',
    conservacion: 'Temperatura ambiente.',
  },

  OLANZAPINA: {
    categoria: 'Antipsicótico atípico.',
    indicaciones: 'Esquizofrenia, trastorno bipolar, náuseas refractarias.',
    posologia: '5–20 mg/día.',
    efectos_adversos: 'Sedación, aumento de peso, dislipidemia, hiperglicemia, hipotensión ortostática, anticolinérgicos.',
    contraindicaciones: 'Hipersensibilidad. Cautela en demencia con psicosis (mayor mortalidad).',
    precauciones_adulto_mayor: 'EVITAR en demencia (caja negra: mayor mortalidad). Riesgo metabólico y de caídas. Si se usa, dosis bajas (2,5–5 mg).',
    interacciones: 'Depresores SNC, anticolinérgicos, prolongadores QT.',
    conservacion: 'Temperatura ambiente.',
  },

  HALOPERIDOL: {
    categoria: 'Antipsicótico típico.',
    indicaciones: 'Esquizofrenia, manía, agitación aguda, delirium hiperactivo (bajas dosis).',
    posologia: '0,5–10 mg/día según indicación.',
    efectos_adversos: 'Síntomas extrapiramidales, discinesia tardía, prolongación QT, síndrome neuroléptico maligno, sedación.',
    contraindicaciones: 'Parkinson, demencia con cuerpos de Lewy, depresión severa, QT largo.',
    precauciones_adulto_mayor: 'EVITAR en demencia (mayor mortalidad y ACV). Si es necesario para delirium severo: 0,25–0,5 mg, evaluar diariamente y retirar lo antes posible.',
    interacciones: 'Prolongadores QT, levodopa (antagonismo), depresores SNC.',
    conservacion: 'Temperatura ambiente.',
  },

  ESZOPICLONA: {
    categoria: 'Hipnótico Z (estereoisómero de zopiclona).',
    indicaciones: 'Insomnio.',
    posologia: '1–3 mg al acostarse.',
    efectos_adversos: 'Sabor metálico, somnolencia residual, mareo, dependencia, conductas complejas durante el sueño.',
    contraindicaciones: 'Apnea severa del sueño, miastenia, hepatopatía severa.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers — caídas, fracturas, confusión). Limitar a 1 mg si es indispensable y por <2 semanas.',
    interacciones: 'Alcohol, opioides, depresores SNC, inhibidores CYP3A4.',
    conservacion: 'Temperatura ambiente.',
  },

  TIOCOLCHICOSIDO: {
    categoria: 'Relajante muscular.',
    indicaciones: 'Contractura muscular dolorosa aguda (corto plazo).',
    posologia: '4–8 mg cada 12 h. No superar 7 días.',
    efectos_adversos: 'Diarrea, somnolencia, reacciones alérgicas. Riesgo teórico de aneuploidía (limitar duración).',
    contraindicaciones: 'Embarazo, lactancia, hipersensibilidad.',
    precauciones_adulto_mayor: 'Limitar a tratamientos cortos. Vigilar somnolencia y caídas.',
    interacciones: 'Depresores SNC.',
    conservacion: 'Temperatura ambiente.',
  },

  BACLOFENO: {
    categoria: 'Relajante muscular central (agonista GABA-B).',
    indicaciones: 'Espasticidad por esclerosis múltiple, lesión medular u otras causas.',
    posologia: '5 mg 3 veces/día, titular hasta 40–80 mg/día.',
    efectos_adversos: 'Somnolencia, debilidad, mareo, hipotensión, confusión. Síndrome de retiro severo si suspende bruscamente.',
    contraindicaciones: 'Úlcera péptica activa, falla renal severa sin ajuste.',
    precauciones_adulto_mayor: 'Iniciar 5 mg/noche. Riesgo de caídas y confusión. NO suspender bruscamente.',
    interacciones: 'Depresores SNC, antihipertensivos.',
    conservacion: 'Temperatura ambiente.',
  },

  TOPIRAMATO: {
    categoria: 'Antiepiléptico, profilaxis de migraña.',
    indicaciones: 'Epilepsia, profilaxis de migraña.',
    posologia: 'Migraña: 25–100 mg/día. Epilepsia: hasta 400 mg/día.',
    efectos_adversos: 'Parestesias, somnolencia, pérdida de peso, dificultad para encontrar palabras, litiasis renal, acidosis metabólica, glaucoma agudo.',
    contraindicaciones: 'Embarazo (teratogénico), hipersensibilidad.',
    precauciones_adulto_mayor: 'Titular lento. Vigilar confusión, peso, hidratación.',
    interacciones: 'Anticonceptivos orales (reduce eficacia a dosis altas), inhibidores carbónicos.',
    conservacion: 'Temperatura ambiente.',
  },

  LEVETIRACETAM: {
    categoria: 'Antiepiléptico.',
    indicaciones: 'Crisis parciales y generalizadas.',
    posologia: '500–3000 mg/día divididos.',
    efectos_adversos: 'Somnolencia, irritabilidad, depresión, fatiga, cefalea.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Buen perfil (sin interacciones mayores). Ajustar a función renal. Vigilar cambios del ánimo.',
    interacciones: 'Pocas (eliminación renal).',
    conservacion: 'Temperatura ambiente.',
  },

  'FENITOINA SODICA': {
    categoria: 'Antiepiléptico.',
    indicaciones: 'Crisis parciales y tónico-clónicas. Estado epiléptico.',
    posologia: 'Adultos: 300–400 mg/día. Margen terapéutico estrecho.',
    efectos_adversos: 'Ataxia, nistagmus, hiperplasia gingival, hirsutismo, rash (riesgo Stevens-Johnson), osteopenia.',
    contraindicaciones: 'Bloqueo AV, bradicardia, hipersensibilidad a hidantoínas.',
    precauciones_adulto_mayor: 'Vigilar niveles (cinética no lineal). Riesgo de caídas. Suplementar vitamina D y calcio si uso crónico.',
    interacciones: 'MUCHAS: warfarina, anticonceptivos, fluconazol, isoniacida, amiodarona, valproato.',
    conservacion: 'Temperatura ambiente, protegido humedad.',
  },

  PRIMIDONA: {
    categoria: 'Antiepiléptico (se metaboliza a fenobarbital).',
    indicaciones: 'Epilepsia, temblor esencial.',
    posologia: 'Temblor: 25–250 mg/noche. Epilepsia: titular hasta 750–1500 mg/día.',
    efectos_adversos: 'Sedación, ataxia, mareo, depresión, dependencia.',
    contraindicaciones: 'Porfiria, hipersensibilidad.',
    precauciones_adulto_mayor: 'EVITAR uso amplio: sedación, caídas. Iniciar 25 mg/noche para temblor.',
    interacciones: 'Inductor enzimático potente: reduce eficacia de anticoagulantes, anticonceptivos, corticoides, ARV.',
    conservacion: 'Temperatura ambiente.',
  },

  'CARBONATO DE LITIO': {
    categoria: 'Estabilizador del ánimo.',
    indicaciones: 'Trastorno bipolar (manía y mantenimiento), trastorno esquizoafectivo.',
    posologia: '600–1200 mg/día divididos. Margen terapéutico estrecho (litemia 0,6–1,0 mEq/L).',
    efectos_adversos: 'Temblor, polidipsia/poliuria, hipotiroidismo, falla renal con uso prolongado, intoxicación (confusión, ataxia, arritmias).',
    contraindicaciones: 'Falla renal severa, deshidratación, embarazo (1er trimestre).',
    precauciones_adulto_mayor: 'Reducir dosis (litio se elimina menos eficientemente). Vigilar litemia, función renal, TSH. Mantener hidratación. Cuidado con AINEs, IECA y diuréticos.',
    interacciones: 'AINEs, IECA/ARA II, tiazidas (aumentan litemia). Cafeína (la baja).',
    conservacion: 'Temperatura ambiente.',
  },

  MEMANTINA: {
    categoria: 'Antagonista de NMDA. Anti-demencia.',
    indicaciones: 'Demencia de Alzheimer moderada a severa.',
    posologia: 'Inicio 5 mg/día, titular semanal hasta 20 mg/día.',
    efectos_adversos: 'Mareo, cefalea, somnolencia, confusión.',
    contraindicaciones: 'Falla renal severa sin ajuste.',
    precauciones_adulto_mayor: 'Beneficio modesto. Ajustar a función renal. Suele combinarse con inhibidor de colinesterasa.',
    interacciones: 'Otros antagonistas NMDA (amantadina, ketamina, dextrometorfano).',
    conservacion: 'Temperatura ambiente.',
  },

  ELETRIPTAN: {
    categoria: 'Agonista 5-HT1B/1D (triptán).',
    indicaciones: 'Crisis de migraña con o sin aura.',
    posologia: '20–40 mg al inicio del dolor, repetir tras 2 h si reaparece. Máximo 80 mg/día.',
    efectos_adversos: 'Opresión torácica, parestesias, somnolencia, náuseas.',
    contraindicaciones: 'Cardiopatía isquémica, ACV, hipertensión no controlada, migraña hemipléjica, uso de IMAOs.',
    precauciones_adulto_mayor: 'EVITAR si hay riesgo cardiovascular. Generalmente no recomendado >65 años.',
    interacciones: 'Inhibidores CYP3A4 (claritromicina, ketoconazol), ergotamina, otros triptanes, ISRS/IRSN.',
    conservacion: 'Temperatura ambiente.',
  },

  NARATRIPTAN: {
    categoria: 'Agonista 5-HT1 (triptán de acción prolongada).',
    indicaciones: 'Crisis de migraña.',
    posologia: '2,5 mg, repetir tras 4 h si reaparece. Máximo 5 mg/día.',
    efectos_adversos: 'Náuseas, somnolencia, parestesias, opresión torácica.',
    contraindicaciones: 'Cardiopatía isquémica, ACV, HTA no controlada, migraña hemipléjica.',
    precauciones_adulto_mayor: 'EVITAR en mayores con riesgo CV.',
    interacciones: 'Ergotamina, otros triptanes, ISRS/IRSN.',
    conservacion: 'Temperatura ambiente.',
  },

  HIDROXICLOROQUINA: {
    categoria: 'Antimalárico inmunomodulador.',
    indicaciones: 'Lupus eritematoso sistémico, artritis reumatoide, Sjögren.',
    posologia: '200–400 mg/día (máximo 5 mg/kg/día de peso real).',
    efectos_adversos: 'Trastornos digestivos, retinopatía con uso prolongado, prolongación QT, miopatía, hipoglicemia.',
    contraindicaciones: 'Retinopatía previa, QT largo, hipersensibilidad.',
    precauciones_adulto_mayor: 'Control oftalmológico basal y anual desde el 5º año. Vigilar QT.',
    interacciones: 'Digoxina, ciclosporina, prolongadores QT, antiácidos (separar 4 h).',
    conservacion: 'Temperatura ambiente.',
  },

  TAMOXIFENO: {
    categoria: 'Modulador selectivo del receptor de estrógeno (SERM).',
    indicaciones: 'Cáncer de mama hormono-sensible (adyuvancia y metastásico).',
    posologia: '20 mg/día.',
    efectos_adversos: 'Sofocos, sangrado vaginal, tromboembolismo, cáncer de endometrio (mujeres), cataratas, hepatotoxicidad.',
    contraindicaciones: 'Tromboembolismo activo, embarazo.',
    precauciones_adulto_mayor: 'Vigilar síntomas trombóticos y sangrado vaginal. Consulta ginecológica anual.',
    interacciones: 'Inhibidores CYP2D6 fuertes (fluoxetina, paroxetina, bupropión) — reducen activación; preferir venlafaxina o sertralina.',
    conservacion: 'Temperatura ambiente.',
  },

  ANASTROZOL: {
    categoria: 'Inhibidor de aromatasa.',
    indicaciones: 'Cáncer de mama hormono-sensible en mujer postmenopáusica.',
    posologia: '1 mg/día.',
    efectos_adversos: 'Sofocos, artralgias, osteoporosis/fracturas, dislipidemia, sequedad vaginal.',
    contraindicaciones: 'Premenopausia, embarazo.',
    precauciones_adulto_mayor: 'Densitometría basal y seguimiento. Suplementar calcio/vitamina D.',
    interacciones: 'Estrógenos (antagonizan), tamoxifeno (no combinar).',
    conservacion: 'Temperatura ambiente.',
  },

  METOTREXATO: {
    categoria: 'Antimetabolito antifólico inmunosupresor.',
    indicaciones: 'Artritis reumatoide, psoriasis, lupus, neoplasias.',
    posologia: 'AR: 7,5–25 mg SEMANAL (oral, SC, IM). NO diario. Suplementar ácido fólico 5 mg/semana.',
    efectos_adversos: 'Mielosupresión, hepatotoxicidad, mucositis, neumonitis, teratogénico.',
    contraindicaciones: 'Embarazo, lactancia, falla renal o hepática severa, citopenias, infección activa.',
    precauciones_adulto_mayor: 'Dosis SEMANAL — error frecuente confundir con diario (riesgo mortal). Ajustar a función renal. Vigilar hemograma y pruebas hepáticas.',
    interacciones: 'AINEs (toxicidad), trimetoprim/sulfas (mielosupresión severa), penicilinas, IBP.',
    conservacion: 'Temperatura ambiente.',
  },

  'AC IBANDRONICO': {
    categoria: 'Bifosfonato.',
    indicaciones: 'Osteoporosis postmenopáusica, hipercalcemia tumoral.',
    posologia: '150 mg vía oral 1 vez/mes, en ayunas con agua, permanecer 1 h erguido sin comer.',
    efectos_adversos: 'Esofagitis, dispepsia, mialgias, osteonecrosis mandibular (rara), fractura atípica de fémur.',
    contraindicaciones: 'Anormalidades esofágicas, hipocalcemia, ClCr <30, imposibilidad de permanecer erguido.',
    precauciones_adulto_mayor: 'Asegurar calcio y vitamina D adecuados. Salud dental al día. Reevaluar tratamiento tras 3–5 años.',
    interacciones: 'Calcio, antiácidos, hierro (separar varias horas).',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Antibióticos / antivirales / antifúngicos ─────────
  CLOXACILINA: {
    categoria: 'Penicilina antiestafilocócica.',
    indicaciones: 'Infecciones por S. aureus sensible (piel, partes blandas, óseas).',
    posologia: 'Adultos: 500 mg cada 6 h, 1 h antes o 2 h después de comidas.',
    efectos_adversos: 'Náuseas, diarrea, rash, hepatitis colestásica (rara), reacciones alérgicas.',
    contraindicaciones: 'Alergia a penicilinas.',
    precauciones_adulto_mayor: 'Ajustar en falla renal. Vigilar transaminasas si uso prolongado.',
    interacciones: 'Probenecid (aumenta niveles), metotrexato.',
    conservacion: 'Temperatura ambiente.',
  },

  FLUCLOXACILINA: {
    categoria: 'Penicilina antiestafilocócica.',
    indicaciones: 'Infecciones por S. aureus sensible.',
    posologia: '500–1000 mg cada 6 h, en ayunas.',
    efectos_adversos: 'Náuseas, diarrea, hepatitis colestásica (mayor en adulto mayor y >2 semanas), rash.',
    contraindicaciones: 'Alergia a penicilinas, antecedente de hepatitis por flucloxacilina.',
    precauciones_adulto_mayor: 'Limitar a <2 semanas si es posible. Vigilar transaminasas.',
    interacciones: 'Metotrexato, probenecid.',
    conservacion: 'Temperatura ambiente.',
  },

  CEFRADINA: {
    categoria: 'Cefalosporina de 1ª generación.',
    indicaciones: 'Infecciones de piel/partes blandas, vías urinarias, faríngeas.',
    posologia: '250–500 mg cada 6 h.',
    efectos_adversos: 'Náuseas, diarrea, rash, candidiasis.',
    contraindicaciones: 'Alergia a cefalosporinas.',
    precauciones_adulto_mayor: 'Ajustar en falla renal. Reacción cruzada con penicilinas (rara, ~2%).',
    interacciones: 'Probenecid, aminoglucósidos (nefro).',
    conservacion: 'Temperatura ambiente.',
  },

  LEVOFLOXACINO: {
    categoria: 'Fluoroquinolona.',
    indicaciones: 'Neumonía, sinusitis, ITU complicada, prostatitis, infección de piel.',
    posologia: '500–750 mg/día.',
    efectos_adversos: 'Tendinopatía/rotura de tendones, neuropatía, alteración glicemia, prolongación QT, disbiosis (C. difficile), aneurisma aórtico.',
    contraindicaciones: 'Antecedente de tendinopatía por quinolonas, miastenia, QT largo, embarazo.',
    precauciones_adulto_mayor: 'EVITAR salvo necesidad por riesgo de tendinitis (sobre todo con corticoides), confusión, hipoglicemia y arritmias.',
    interacciones: 'Antiácidos, sucralfato, hierro, calcio (separar 2 h). Warfarina, sulfonilureas, corticoides.',
    conservacion: 'Temperatura ambiente.',
  },

  CLARITROMICINA: {
    categoria: 'Macrólido.',
    indicaciones: 'Infecciones respiratorias, H. pylori (combinada), piel.',
    posologia: '500 mg cada 12 h por 7–14 días.',
    efectos_adversos: 'Disgeusia, náuseas, hepatitis, prolongación QT, diarrea.',
    contraindicaciones: 'QT largo, uso con simvastatina/lovastatina, colquicina en falla renal, embarazo.',
    precauciones_adulto_mayor: 'Vigilar QT. Muchas interacciones — revisar medicación habitual.',
    interacciones: 'Simvastatina/lovastatina (rabdomiólisis), warfarina, digoxina, colchicina, calcioantagonistas, carbamazepina.',
    conservacion: 'Temperatura ambiente.',
  },

  ERITROMICINA: {
    categoria: 'Macrólido clásico.',
    indicaciones: 'Infecciones respiratorias, piel, alternativa en alergia a penicilina. Gastroparesia (procinético).',
    posologia: '250–500 mg cada 6 h.',
    efectos_adversos: 'Náuseas, diarrea (procinético), prolongación QT, hepatitis colestásica.',
    contraindicaciones: 'QT largo, hepatopatía.',
    precauciones_adulto_mayor: 'Mismas interacciones y QT que claritromicina. Mala tolerancia digestiva.',
    interacciones: 'Estatinas (rabdomiólisis), warfarina, digoxina, carbamazepina, teofilina, colchicina.',
    conservacion: 'Temperatura ambiente.',
  },

  CLORANFENICOL: {
    categoria: 'Antibiótico de amplio espectro. Uso predominantemente tópico (colirio, ungüento).',
    indicaciones: 'Conjuntivitis bacteriana, infecciones oftalmológicas externas.',
    posologia: 'Colirio: 1 gota cada 3–6 h. Ungüento: aplicar 2–4 veces/día.',
    efectos_adversos: 'Locales: irritación. Sistémico (raro por colirio): aplasia medular (rara pero grave).',
    contraindicaciones: 'Hipersensibilidad, antecedente de discrasias sanguíneas.',
    precauciones_adulto_mayor: 'Uso corto (<10 días). No usar de forma profiláctica.',
    interacciones: 'Locales mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  MEBENDAZOL: {
    categoria: 'Antiparasitario.',
    indicaciones: 'Oxiuros, Ascaris, Trichuris, anquilostomas.',
    posologia: 'Oxiuros: 100 mg dosis única, repetir a las 2 semanas. Otros: 100 mg cada 12 h por 3 días.',
    efectos_adversos: 'Dolor abdominal, diarrea, rash, raro neutropenia.',
    contraindicaciones: 'Embarazo (1er trimestre), hipersensibilidad.',
    precauciones_adulto_mayor: 'Buena tolerancia.',
    interacciones: 'Carbamazepina, fenitoína (reducen niveles).',
    conservacion: 'Temperatura ambiente.',
  },

  ITRACONAZOL: {
    categoria: 'Antifúngico triazólico.',
    indicaciones: 'Onicomicosis, candidiasis, dermatofitosis, micosis sistémicas.',
    posologia: 'Onicomicosis: 200 mg cada 12 h por 7 días, descansar 3 semanas (pulso). Con comida.',
    efectos_adversos: 'Hepatotoxicidad, edema, insuficiencia cardíaca (no usar si IC), náuseas, neuropatía.',
    contraindicaciones: 'Insuficiencia cardíaca, hepatopatía severa, uso con simvastatina/lovastatina, embarazo.',
    precauciones_adulto_mayor: 'Vigilar IC y transaminasas. Muchas interacciones.',
    interacciones: 'Estatinas, warfarina, digoxina, calcioantagonistas, midazolam, sildenafil.',
    conservacion: 'Temperatura ambiente.',
  },

  AMOROLFINA: {
    categoria: 'Antifúngico tópico (esmalte ungueal).',
    indicaciones: 'Onicomicosis sin compromiso de matriz.',
    posologia: 'Aplicar 1–2 veces por semana, previo limado y limpieza con alcohol.',
    efectos_adversos: 'Irritación local, decoloración ungueal.',
    contraindicaciones: 'Hipersensibilidad. Embarazo (precaución).',
    precauciones_adulto_mayor: 'Útil cuando no se puede usar oral. Tratamiento prolongado (6–12 meses).',
    interacciones: 'Mínimas (uso tópico).',
    conservacion: 'Temperatura ambiente.',
  },

  CICLOPIROXOLAMINA: {
    categoria: 'Antifúngico tópico.',
    indicaciones: 'Dermatofitosis, candidiasis cutánea, pitiriasis versicolor, onicomicosis.',
    posologia: 'Crema: 2 veces/día. Esmalte ungueal: diario.',
    efectos_adversos: 'Irritación, prurito, eritema locales.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Buena tolerancia.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  TOLNAFTATO: {
    categoria: 'Antifúngico tópico.',
    indicaciones: 'Tiña pedis, corporis, cruris.',
    posologia: 'Aplicar 2 veces/día por 2–4 semanas.',
    efectos_adversos: 'Irritación leve.',
    contraindicaciones: 'Hipersensibilidad. No usar en uñas o cuero cabelludo.',
    precauciones_adulto_mayor: 'Bien tolerado.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  FENTICONAZOL: {
    categoria: 'Antifúngico imidazólico tópico/vaginal.',
    indicaciones: 'Candidiasis vulvovaginal, dermatofitosis.',
    posologia: 'Óvulo 600 mg dosis única o crema 2%: aplicar diariamente.',
    efectos_adversos: 'Irritación, prurito.',
    contraindicaciones: 'Hipersensibilidad. No usar con preservativo/diafragma de látex (deteriora).',
    precauciones_adulto_mayor: 'Bien tolerado.',
    interacciones: 'Mínimas (uso tópico).',
    conservacion: 'Temperatura ambiente.',
  },

  VALACICLOVIR: {
    categoria: 'Antiviral (profármaco de aciclovir).',
    indicaciones: 'Herpes simple genital/labial, herpes zóster, profilaxis HSV recurrente.',
    posologia: 'Zóster: 1 g cada 8 h por 7 días. HSV recurrente: 500 mg cada 12 h por 3 días.',
    efectos_adversos: 'Cefalea, náuseas, alteración renal, confusión (en falla renal).',
    contraindicaciones: 'Hipersensibilidad a aciclovir.',
    precauciones_adulto_mayor: 'Ajustar a función renal y mantener buena hidratación. Confusión más frecuente.',
    interacciones: 'Probenecid, cimetidina (aumentan niveles), nefrotóxicos.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Respiratorios / antihistamínicos ─────────
  'IPRATROPIO BROMURO': {
    categoria: 'Broncodilatador anticolinérgico inhalado.',
    indicaciones: 'EPOC, asma (complementario).',
    posologia: 'Inhalador: 20–40 mcg 3–4 veces/día. Nebulización: 250–500 mcg cada 6 h.',
    efectos_adversos: 'Boca seca, tos, retención urinaria, glaucoma (si llega al ojo), palpitaciones.',
    contraindicaciones: 'Hipersensibilidad a atropina, glaucoma de ángulo estrecho (precaución).',
    precauciones_adulto_mayor: 'Útil en EPOC. Evitar contacto con los ojos.',
    interacciones: 'Otros anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  MONTELUKAST: {
    categoria: 'Antileucotrieno.',
    indicaciones: 'Asma persistente, rinitis alérgica, asma inducida por ejercicio.',
    posologia: 'Adultos: 10 mg/noche.',
    efectos_adversos: 'Cefalea, alteraciones del ánimo y conducta (depresión, ansiedad, ideación suicida — caja negra), sueños vívidos, dolor abdominal.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Vigilar cambios del ánimo y conducta. Suspender si aparecen.',
    interacciones: 'Fenobarbital, rifampicina (reducen niveles).',
    conservacion: 'Temperatura ambiente.',
  },

  TEOFILINA: {
    categoria: 'Broncodilatador metilxantina.',
    indicaciones: 'Asma y EPOC (tercera línea).',
    posologia: '300–600 mg/día (liberación prolongada). Margen terapéutico estrecho (10–20 mcg/ml).',
    efectos_adversos: 'Náuseas, insomnio, taquicardia, arritmias, convulsiones (toxicidad).',
    contraindicaciones: 'Arritmias graves, convulsiones, úlcera activa.',
    precauciones_adulto_mayor: 'EVITAR si es posible. Si se usa, dosis baja, vigilar niveles. Muchas interacciones.',
    interacciones: 'Macrólidos, quinolonas, cimetidina, alopurinol, tabaco (reduce niveles).',
    conservacion: 'Temperatura ambiente.',
  },

  'N-ACETILCISTEINA': {
    categoria: 'Mucolítico y antioxidante.',
    indicaciones: 'Secreciones bronquiales espesas, EPOC, intoxicación por paracetamol.',
    posologia: '600 mg/día oral (o 200 mg cada 8 h).',
    efectos_adversos: 'Náuseas, vómitos, broncoespasmo (inhalado), rash.',
    contraindicaciones: 'Úlcera activa, asma severa (precaución).',
    precauciones_adulto_mayor: 'Bien tolerada. Tomar con bastante agua.',
    interacciones: 'Nitroglicerina (potencia vasodilatación).',
    conservacion: 'Temperatura ambiente.',
  },

  DESLORATADINA: {
    categoria: 'Antihistamínico H1 de 2ª generación (no sedante).',
    indicaciones: 'Rinitis alérgica, urticaria crónica.',
    posologia: 'Adultos: 5 mg/día.',
    efectos_adversos: 'Cefalea, fatiga, boca seca (poco frecuentes).',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Buen perfil. Sin efectos anticolinérgicos relevantes.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  RUPATADINA: {
    categoria: 'Antihistamínico H1 de 2ª generación y antagonista PAF.',
    indicaciones: 'Rinitis alérgica, urticaria.',
    posologia: 'Adultos: 10 mg/día.',
    efectos_adversos: 'Somnolencia leve, cefalea, boca seca, prolongación QT a dosis altas.',
    contraindicaciones: 'QT largo, uso con inhibidores potentes CYP3A4.',
    precauciones_adulto_mayor: 'Sin estudios extensos en >65 años. Iniciar con cautela.',
    interacciones: 'Ketoconazol, claritromicina, jugo de pomelo.',
    conservacion: 'Temperatura ambiente.',
  },

  'EXTRACTO HEDERA HELIX': {
    categoria: 'Mucolítico/expectorante fitoterápico (hiedra).',
    indicaciones: 'Tos productiva en bronquitis aguda.',
    posologia: 'Adultos: 5 ml de jarabe 2–3 veces/día.',
    efectos_adversos: 'Molestias gástricas, rash alérgico (raro).',
    contraindicaciones: 'Hipersensibilidad, intolerancia a fructosa (jarabes).',
    precauciones_adulto_mayor: 'Bien tolerado. Evidencia limitada pero perfil seguro.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  'PELARGONIUM SIDOIDES': {
    categoria: 'Fitoterápico (geranio sudafricano).',
    indicaciones: 'Bronquitis aguda, sinusitis, faringitis (sintomático).',
    posologia: 'Adultos: 30 gotas 3 veces/día por 7 días.',
    efectos_adversos: 'Molestias digestivas, raro hepatitis.',
    contraindicaciones: 'Hepatopatía, hipersensibilidad, anticoagulantes (vigilar).',
    precauciones_adulto_mayor: 'Suspender si aparecen síntomas hepáticos.',
    interacciones: 'Anticoagulantes (vigilar INR).',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Oftálmicos / otros ─────────
  LATANOPROST: {
    categoria: 'Análogo de prostaglandina (colirio).',
    indicaciones: 'Glaucoma de ángulo abierto, hipertensión ocular.',
    posologia: '1 gota en cada ojo afecto al acostarse (1 vez/día).',
    efectos_adversos: 'Hiperemia conjuntival, oscurecimiento del iris (irreversible), crecimiento de pestañas, hiperpigmentación periorbitaria.',
    contraindicaciones: 'Hipersensibilidad. Cautela en uveítis, herpes ocular.',
    precauciones_adulto_mayor: 'Primera línea en glaucoma. Aplicar al acostarse. Refrigerar antes de abrir.',
    interacciones: 'Mínimas sistémicas.',
    conservacion: 'Refrigerado antes de abrir. Una vez abierto, temperatura ambiente.',
  },

  DORZOLAMIDA: {
    categoria: 'Inhibidor de anhidrasa carbónica (colirio).',
    indicaciones: 'Glaucoma de ángulo abierto, hipertensión ocular.',
    posologia: '1 gota cada 8 h (monoterapia) o cada 12 h (combinada).',
    efectos_adversos: 'Sabor amargo, escozor, queratitis punctata, alergia.',
    contraindicaciones: 'Alergia a sulfonamidas, falla renal severa.',
    precauciones_adulto_mayor: 'Reportar sabor amargo persistente.',
    interacciones: 'Aspirina dosis alta, otros inhibidores carbónicos.',
    conservacion: 'Temperatura ambiente.',
  },

  PILOCARPINA: {
    categoria: 'Colinérgico (colirio); también oral para xerostomía.',
    indicaciones: 'Glaucoma de ángulo cerrado agudo, xerostomía (Sjögren, post-radioterapia).',
    posologia: 'Colirio: 1 gota cada 6–8 h. Oral: 5 mg 3–4 veces/día.',
    efectos_adversos: 'Miosis, visión borrosa nocturna, sudoración, salivación, broncoespasmo.',
    contraindicaciones: 'Iritis, asma severa, glaucoma de ángulo estrecho no controlado.',
    precauciones_adulto_mayor: 'Visión nocturna comprometida por miosis (riesgo de caídas).',
    interacciones: 'Betabloqueantes (bradicardia), otros colinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  OLOPATADINA: {
    categoria: 'Antihistamínico/estabilizador de mastocitos (colirio).',
    indicaciones: 'Conjuntivitis alérgica.',
    posologia: '1 gota cada 12 h (0,1%) o 1 vez/día (0,2%).',
    efectos_adversos: 'Escozor leve, cefalea, sabor amargo.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Bien tolerado.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  NAFAZOLINA: {
    categoria: 'Simpaticomimético (descongestionante nasal/ocular).',
    indicaciones: 'Congestión nasal, ojo rojo no infeccioso (uso muy corto).',
    posologia: '1–2 gotas/aplicaciones cada 6 h, máximo 3 días.',
    efectos_adversos: 'Rebote (congestión rinitis medicamentosa), taquicardia, hipertensión, midriasis.',
    contraindicaciones: 'Glaucoma de ángulo estrecho, HTA no controlada, niños pequeños, IMAOs.',
    precauciones_adulto_mayor: 'EVITAR si hay HTA o cardiopatía. Limitar a 3 días.',
    interacciones: 'IMAOs, antidepresivos tricíclicos.',
    conservacion: 'Temperatura ambiente.',
  },

  OXIMETAZOLINA: {
    categoria: 'Descongestionante nasal alfa-adrenérgico.',
    indicaciones: 'Congestión nasal aguda.',
    posologia: '2–3 sprays cada 12 h, máximo 5 días.',
    efectos_adversos: 'Rinitis medicamentosa por rebote, taquicardia, hipertensión, sequedad nasal.',
    contraindicaciones: 'HTA no controlada, glaucoma, IMAOs, niños <6 años.',
    precauciones_adulto_mayor: 'EVITAR uso prolongado. Cautela en cardiopatía e HTA.',
    interacciones: 'IMAOs, antidepresivos tricíclicos.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Urología ─────────
  TOLTERODINA: {
    categoria: 'Anticolinérgico antimuscarínico (vejiga).',
    indicaciones: 'Vejiga hiperactiva, incontinencia de urgencia.',
    posologia: '2 mg cada 12 h (o 4 mg/día retard).',
    efectos_adversos: 'Boca seca, estreñimiento, retención urinaria, visión borrosa, confusión.',
    contraindicaciones: 'Retención urinaria, glaucoma de ángulo estrecho, megacolon, miastenia.',
    precauciones_adulto_mayor: 'EVITAR si es posible (criterios Beers — carga anticolinérgica). Preferir mirabegrón o medidas conductuales.',
    interacciones: 'Inhibidores CYP3A4 (ketoconazol, claritromicina), otros anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  'TROSPIO CLORURO': {
    categoria: 'Anticolinérgico antimuscarínico (vejiga). No cruza barrera hematoencefálica.',
    indicaciones: 'Vejiga hiperactiva.',
    posologia: '20 mg cada 12 h, en ayunas.',
    efectos_adversos: 'Boca seca, estreñimiento, retención urinaria.',
    contraindicaciones: 'Retención urinaria, glaucoma de ángulo estrecho, megacolon.',
    precauciones_adulto_mayor: 'Mejor perfil cognitivo que oxibutinina/tolterodina por no atravesar BHE, pero igual evitar cuando sea posible.',
    interacciones: 'Otros anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  FLAVOXATO: {
    categoria: 'Antiespasmódico urinario.',
    indicaciones: 'Disuria, frecuencia, urgencia, nicturia por cistitis o uretritis.',
    posologia: '200 mg 3–4 veces/día.',
    efectos_adversos: 'Boca seca, somnolencia, náuseas, visión borrosa.',
    contraindicaciones: 'Obstrucción urinaria o gastrointestinal, glaucoma.',
    precauciones_adulto_mayor: 'Carga anticolinérgica menor que oxibutinina pero igual con cautela.',
    interacciones: 'Otros anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Dermo / tópico ─────────
  TRETINOINA: {
    categoria: 'Retinoide tópico.',
    indicaciones: 'Acné, fotoenvejecimiento, queratosis actínica.',
    posologia: 'Crema 0,025–0,05%: aplicación nocturna fina tras lavado.',
    efectos_adversos: 'Eritema, descamación, irritación, fotosensibilidad.',
    contraindicaciones: 'Embarazo, eccema, quemadura solar.',
    precauciones_adulto_mayor: 'Usar protector solar diario. Iniciar gradualmente para tolerancia.',
    interacciones: 'Productos irritantes/descamantes concomitantes.',
    conservacion: 'Temperatura ambiente, protegido de la luz.',
  },

  UREA: {
    categoria: 'Queratolítico e hidratante tópico.',
    indicaciones: 'Hiperqueratosis, xerosis, talones agrietados, eccema, ictiosis.',
    posologia: 'Crema 5–10%: hidratación. 20–40%: queratolítico. Aplicar 1–2 veces/día.',
    efectos_adversos: 'Escozor leve, irritación.',
    contraindicaciones: 'Piel agrietada extensa (concentraciones altas).',
    precauciones_adulto_mayor: 'Excelente para xerosis y talones de adulto mayor. Aplicar tras la ducha.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  HIDROCORTISONA: {
    categoria: 'Corticoide tópico de baja potencia. También vía oral en insuficiencia suprarrenal.',
    indicaciones: 'Dermatitis leve (atópica, contacto), eccema, prurito.',
    posologia: 'Crema 1%: 1–2 veces/día por máximo 7 días en cara/pliegues.',
    efectos_adversos: 'Atrofia, telangiectasias, hipopigmentación con uso prolongado.',
    contraindicaciones: 'Infección cutánea no tratada, rosácea, acné.',
    precauciones_adulto_mayor: 'Apropiada para cara y pliegues por baja potencia. Uso corto.',
    interacciones: 'Mínimas tópicas.',
    conservacion: 'Temperatura ambiente.',
  },

  CAPSAICINA: {
    categoria: 'Análogo de capsaicina (depleta sustancia P).',
    indicaciones: 'Dolor neuropático localizado (neuralgia postherpética, diabética), artrosis.',
    posologia: 'Crema 0,025–0,075%: aplicación 3–4 veces/día. Tarda 2–4 semanas en efecto.',
    efectos_adversos: 'Ardor, eritema local (puede ser intenso al inicio).',
    contraindicaciones: 'Piel lesionada. Lavar manos tras aplicar; evitar mucosas y ojos.',
    precauciones_adulto_mayor: 'Buena opción local cuando los analgésicos sistémicos están limitados.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  DEXPANTENOL: {
    categoria: 'Provitamina B5 tópica (regenerador epitelial).',
    indicaciones: 'Heridas leves, dermatitis del pañal, irritación cutánea, pezones agrietados.',
    posologia: 'Crema/ungüento 5%: aplicar varias veces al día.',
    efectos_adversos: 'Rash alérgico raro.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Útil en piel frágil y heridas superficiales.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  'POVIDONA YODADA': {
    categoria: 'Antiséptico yodado de amplio espectro.',
    indicaciones: 'Antisepsia cutánea, heridas, antisepsia quirúrgica, gargarismos.',
    posologia: 'Solución 10%: aplicar sobre la zona. Diluida para gargarismos.',
    efectos_adversos: 'Tinción cutánea reversible, irritación, dermatitis alérgica. Absorción sistémica de yodo con uso extenso.',
    contraindicaciones: 'Alergia al yodo, hipertiroidismo, neonatos, embarazo (no extenso), tras radioyodo.',
    precauciones_adulto_mayor: 'No aplicar en grandes superficies cronicamente (absorción tiroidea).',
    interacciones: 'Litio (hipotiroidismo), antitiroideos.',
    conservacion: 'Temperatura ambiente, protegido luz.',
  },

  'AC HIALURONICO': {
    categoria: 'Hidratante/lubricante (oftálmico, articular, dermatológico).',
    indicaciones: 'Ojo seco, hidratación dérmica, viscosuplementación intraarticular.',
    posologia: 'Colirio: 1 gota varias veces/día. Articular: por especialista.',
    efectos_adversos: 'Visión borrosa transitoria; locales en articulación.',
    contraindicaciones: 'Infección en sitio de aplicación.',
    precauciones_adulto_mayor: 'Buen perfil. Preferir colirios sin preservantes para uso frecuente.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  TRICLOSAN: {
    categoria: 'Antiséptico/antibacteriano tópico.',
    indicaciones: 'Antisepsia cutánea, higiene dental (algunos enjuagues).',
    posologia: 'Según producto.',
    efectos_adversos: 'Irritación, alergia.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Uso ocasional.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  'AC SALICILICO': {
    categoria: 'Queratolítico tópico.',
    indicaciones: 'Verrugas, callosidades, acné, psoriasis, hiperqueratosis.',
    posologia: 'Concentración 2–40% según indicación. Aplicación local.',
    efectos_adversos: 'Irritación, descamación, salicilismo (uso extenso).',
    contraindicaciones: 'Diabetes (lesiones en pie), niños pequeños, embarazo (extenso).',
    precauciones_adulto_mayor: 'EVITAR en pie diabético o de mala circulación. Aplicación localizada.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  'AC GLICOLICO': {
    categoria: 'Alfa-hidroxiácido queratolítico.',
    indicaciones: 'Fotoenvejecimiento, manchas, acné, hiperqueratosis.',
    posologia: 'Crema/gel 5–15% diario; peelings por profesional.',
    efectos_adversos: 'Irritación, fotosensibilidad.',
    contraindicaciones: 'Piel irritada, embarazo (concentraciones altas).',
    precauciones_adulto_mayor: 'Usar protector solar diario.',
    interacciones: 'Otros queratolíticos (potencian irritación).',
    conservacion: 'Temperatura ambiente.',
  },

  'AC LACTICO': {
    categoria: 'Alfa-hidroxiácido humectante y queratolítico.',
    indicaciones: 'Xerosis, ictiosis, hiperqueratosis.',
    posologia: 'Lociones 5–12%: 1–2 veces/día.',
    efectos_adversos: 'Irritación leve, fotosensibilidad.',
    contraindicaciones: 'Piel agrietada extensa.',
    precauciones_adulto_mayor: 'Excelente para xerosis. Protector solar.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── OTC químicos / hidratantes ─────────
  'ALCOHOL DESNATURALIZADO': {
    categoria: 'Antiséptico/desinfectante de uso externo (etanol con denaturantes).',
    indicaciones: 'Antisepsia de piel intacta, superficies, equipamiento.',
    posologia: 'Aplicar/rociar sobre piel intacta o superficies. NO ingerir.',
    efectos_adversos: 'Sequedad cutánea, irritación, ardor en piel lesionada.',
    contraindicaciones: 'Piel quemada o herida abierta extensa. Mucosas. Ingesta.',
    precauciones_adulto_mayor: 'Hidratar la piel tras uso frecuente. Mantener lejos de llamas.',
    interacciones: 'Mínimas tópicas.',
    conservacion: 'Inflamable. Lejos del calor y llamas.',
  },

  'ALCOHOL ISOPROPILICO': {
    categoria: 'Antiséptico/desinfectante de uso externo.',
    indicaciones: 'Desinfección de piel intacta y superficies. Limpieza electrónica.',
    posologia: 'Aplicar tópico. NO ingerir.',
    efectos_adversos: 'Sequedad, irritación, neurotoxicidad si se ingiere.',
    contraindicaciones: 'Heridas abiertas, ingesta.',
    precauciones_adulto_mayor: 'Mismas precauciones que etanol denaturalizado.',
    interacciones: 'Mínimas tópicas.',
    conservacion: 'Inflamable. Lejos del calor.',
  },

  'PEROXIDO DE HIDROGENO': {
    categoria: 'Antiséptico oxidante (agua oxigenada).',
    indicaciones: 'Limpieza de heridas superficiales (uso puntual), enjuague bucal diluido.',
    posologia: '3%: aplicar sobre la herida, enjuagar con suero. Bucal: diluir al 1,5% (mitad y mitad con agua).',
    efectos_adversos: 'Retrasa la cicatrización con uso repetido (daña tejido sano), irritación, blanqueo de tejidos.',
    contraindicaciones: 'Heridas profundas o cavitadas (riesgo de embolia gaseosa).',
    precauciones_adulto_mayor: 'Uso puntual. Preferir suero fisiológico para limpiar heridas crónicas.',
    interacciones: 'Mínimas.',
    conservacion: 'Refrigerado o lugar fresco, protegido luz.',
  },

  'CLORURO DE SODIO': {
    categoria: 'Solución salina isotónica (suero fisiológico).',
    indicaciones: 'Lavado de heridas, lavado nasal/ocular, hidratación de mucosas, vehículo de inhalación.',
    posologia: 'Aplicación local según necesidad. Nasal: 1–2 sprays/aplicaciones por fosa varias veces/día.',
    efectos_adversos: 'Prácticamente nulos.',
    contraindicaciones: 'Hipersensibilidad (rara).',
    precauciones_adulto_mayor: 'Útil para sequedad nasal, ojo seco leve y limpieza de heridas.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  GLICERINA: {
    categoria: 'Humectante. Laxante (supositorio) y emoliente cutáneo.',
    indicaciones: 'Estreñimiento ocasional (supositorio), hidratación cutánea.',
    posologia: 'Supositorio adulto: 1 al día PRN. Tópico: según producto.',
    efectos_adversos: 'Irritación rectal local, sensación de calor.',
    contraindicaciones: 'Sangrado rectal sin diagnóstico, obstrucción.',
    precauciones_adulto_mayor: 'Útil como medida puntual para estreñimiento.',
    interacciones: 'Mínimas.',
    conservacion: 'Refrigerar supositorios.',
  },

  DIETILTOLUAMIDA: {
    categoria: 'Repelente de insectos (DEET).',
    indicaciones: 'Prevención de picaduras de mosquitos, tábanos, garrapatas (zika, dengue, malaria).',
    posologia: 'Aplicación tópica 10–30% sobre piel expuesta o ropa. Repetir según producto.',
    efectos_adversos: 'Irritación cutánea, rash. Puede dañar plásticos, lentes.',
    contraindicaciones: 'Mucosas, ojos, heridas. Niños <2 meses.',
    precauciones_adulto_mayor: 'Aplicar con manos limpias evitando ojos. Lavar al regresar a interior.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente. Inflamable en aerosoles.',
  },

  'ACEITE DE RICINO': {
    categoria: 'Laxante estimulante y emoliente tópico.',
    indicaciones: 'Estreñimiento puntual (poco usado). Cuidado capilar y de pestañas.',
    posologia: 'Oral: 15–30 ml dosis única (no recomendado de rutina).',
    efectos_adversos: 'Cólicos intensos, diarrea, deshidratación.',
    contraindicaciones: 'Obstrucción, embarazo, dolor abdominal.',
    precauciones_adulto_mayor: 'EVITAR como laxante — preferir macrogol/lactulosa.',
    interacciones: 'Diuréticos (hipokalemia).',
    conservacion: 'Temperatura ambiente, protegido luz.',
  },

  'MANTECA DE CACAO': {
    categoria: 'Emoliente labial y cutáneo.',
    indicaciones: 'Resequedad labial, prevención de fisuras.',
    posologia: 'Aplicar según necesidad.',
    efectos_adversos: 'Alergia rara.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Útil para labios secos.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Vitaminas / minerales / herbales ─────────
  'VITAMINA E': {
    categoria: 'Vitamina liposoluble (tocoferol). Antioxidante.',
    indicaciones: 'Déficit de vitamina E (raro). Apoyo dérmico.',
    posologia: '100–400 UI/día. Dosis altas no recomendadas de rutina.',
    efectos_adversos: 'Dosis altas (>400 UI/día): mayor riesgo de sangrado y mortalidad CV.',
    contraindicaciones: 'Hipersensibilidad. Anticoagulantes (precaución).',
    precauciones_adulto_mayor: 'NO usar dosis altas (>400 UI). Cautela con anticoagulantes.',
    interacciones: 'Warfarina, antiagregantes (aumenta riesgo sangrado).',
    conservacion: 'Temperatura ambiente, protegido luz.',
  },

  'VITAMINA A': {
    categoria: 'Vitamina liposoluble (retinol).',
    indicaciones: 'Déficit de vitamina A, xeroftalmía, dermatosis.',
    posologia: 'Adultos: 700–900 mcg ER/día. No exceder 3000 mcg/día crónico.',
    efectos_adversos: 'Hipervitaminosis: cefalea, náuseas, hepatotoxicidad, osteoporosis, teratogenicidad.',
    contraindicaciones: 'Embarazo (dosis altas — teratogénico), hipervitaminosis.',
    precauciones_adulto_mayor: 'Riesgo de osteoporosis con dosis altas crónicas.',
    interacciones: 'Retinoides orales (acumulación), warfarina.',
    conservacion: 'Temperatura ambiente, protegido luz.',
  },

  TIAMINA: {
    categoria: 'Vitamina B1.',
    indicaciones: 'Déficit (beriberi, encefalopatía de Wernicke), alcoholismo, neuropatía.',
    posologia: '50–300 mg/día oral según indicación.',
    efectos_adversos: 'Bien tolerada oral. Anafilaxia rara IV.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Útil en sospecha de déficit por desnutrición o alcohol.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  BIOTINA: {
    categoria: 'Vitamina B7 (biotina).',
    indicaciones: 'Déficit, alopecia, fragilidad ungueal.',
    posologia: '30–10000 mcg/día según indicación. Evidencia en cabello/uñas limitada.',
    efectos_adversos: 'Bien tolerada. Dosis altas pueden alterar análisis de laboratorio (TSH, troponina).',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Avisar al laboratorio sobre su uso para evitar interferencias.',
    interacciones: 'Interfiere con inmunoensayos basados en biotina-estreptavidina.',
    conservacion: 'Temperatura ambiente.',
  },

  DHA: {
    categoria: 'Ácido graso omega-3 (docosahexaenoico).',
    indicaciones: 'Apoyo cardiovascular, función cognitiva, salud visual.',
    posologia: '200–1000 mg/día según producto.',
    efectos_adversos: 'Eructo de pescado, malestar gástrico, riesgo de sangrado a dosis altas (>3 g/día).',
    contraindicaciones: 'Hipersensibilidad al pescado, anticoagulación intensa.',
    precauciones_adulto_mayor: 'Cautela si toma anticoagulantes. Tomar con comida para reducir reflujo.',
    interacciones: 'Warfarina, antiagregantes (sangrado a dosis altas).',
    conservacion: 'Refrigerar tras abrir si lo indica el envase.',
  },

  HIERRO: {
    categoria: 'Mineral. Suplementación oral.',
    indicaciones: 'Anemia ferropénica, déficit de hierro.',
    posologia: '60–200 mg de hierro elemental/día. Mejor absorción en ayunas con vitamina C; si hay intolerancia, con comida.',
    efectos_adversos: 'Estreñimiento, náuseas, dolor abdominal, deposiciones negras.',
    contraindicaciones: 'Sobrecarga de hierro (hemocromatosis), anemia no ferropénica.',
    precauciones_adulto_mayor: 'Estreñimiento frecuente — considerar dosis a días alternos (mejor tolerancia, igual eficacia). Separar 2 h de antiácidos y levotiroxina.',
    interacciones: 'Reduce absorción de quinolonas, tetraciclinas, levotiroxina, bifosfonatos. Antiácidos y té reducen su absorción.',
    conservacion: 'Temperatura ambiente. Fuera del alcance de niños (sobredosis tóxica).',
  },

  'OXIDO DE ZINC': {
    categoria: 'Barrera/astringente tópico.',
    indicaciones: 'Dermatitis del pañal, irritación cutánea, protección solar (zinc físico).',
    posologia: 'Aplicar capa fina sobre la zona afectada en cada cambio.',
    efectos_adversos: 'Reacción alérgica rara.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Útil para incontinencia/dermatitis perianal.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  'SULFATO DE ZINC': {
    categoria: 'Suplemento de zinc.',
    indicaciones: 'Déficit de zinc, acrodermatitis enteropática, apoyo en diarrea infantil (OMS).',
    posologia: 'Adultos: 25–50 mg zinc elemental/día con comida.',
    efectos_adversos: 'Náuseas, sabor metálico, déficit de cobre con uso prolongado.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'No exceder 40 mg/día crónico. Separar 2 h de quinolonas, tetraciclinas, hierro.',
    interacciones: 'Quinolonas, tetraciclinas, hierro, penicilamina.',
    conservacion: 'Temperatura ambiente.',
  },

  POTASIO: {
    categoria: 'Suplemento de potasio.',
    indicaciones: 'Hipopotasemia (por diuréticos, vómitos, diarrea).',
    posologia: 'Variable según indicación médica.',
    efectos_adversos: 'Náuseas, dolor epigástrico, úlcera esofágica (formulación sólida sin agua), hiperpotasemia.',
    contraindicaciones: 'Falla renal severa, hiperpotasemia, uso de ahorradores de potasio.',
    precauciones_adulto_mayor: 'Tomar con bastante agua y en posición erguida. Vigilar potasio y creatinina.',
    interacciones: 'IECA/ARA II, espironolactona, AINEs (hiperkalemia).',
    conservacion: 'Temperatura ambiente.',
  },

  MAGNESIO: {
    categoria: 'Suplemento de magnesio (bisglicinato, citrato, óxido).',
    indicaciones: 'Déficit, calambres, estreñimiento, profilaxis migraña.',
    posologia: '200–400 mg de magnesio elemental/día.',
    efectos_adversos: 'Diarrea (frecuente, sobre todo con óxido/citrato), náuseas. Hipermagnesemia en falla renal.',
    contraindicaciones: 'Falla renal moderada-severa, bloqueo AV.',
    precauciones_adulto_mayor: 'Preferir bisglicinato si predomina estreñimiento (mejor tolerado). Cautela en falla renal.',
    interacciones: 'Quinolonas, tetraciclinas, bifosfonatos (separar 2 h). Digoxina, diuréticos.',
    conservacion: 'Temperatura ambiente.',
  },

  'AC HIGADO DE BACALAO': {
    categoria: 'Aceite rico en vitaminas A, D y omega-3.',
    indicaciones: 'Apoyo nutricional, déficit de vitaminas A/D.',
    posologia: '1 cápsula/cucharada al día con comida.',
    efectos_adversos: 'Eructo, malestar gástrico, hipervitaminosis A/D con dosis altas.',
    contraindicaciones: 'Hipervitaminosis A/D. Anticoagulación intensa.',
    precauciones_adulto_mayor: 'No combinar con otros suplementos altos de vitamina A.',
    interacciones: 'Warfarina (sangrado).',
    conservacion: 'Lugar fresco, protegido luz.',
  },

  VALERIANA: {
    categoria: 'Sedante/ansiolítico fitoterápico.',
    indicaciones: 'Ansiedad leve, insomnio de conciliación.',
    posologia: 'Extracto: 300–600 mg al acostarse.',
    efectos_adversos: 'Somnolencia residual, cefalea, malestar digestivo. Hepatotoxicidad rara.',
    contraindicaciones: 'Hepatopatía, embarazo, cirugía próxima.',
    precauciones_adulto_mayor: 'Sedación leve — vigilar caídas si se combina con otros sedantes.',
    interacciones: 'Depresores SNC, alcohol, benzodiacepinas.',
    conservacion: 'Temperatura ambiente.',
  },

  PASIFLORA: {
    categoria: 'Sedante/ansiolítico fitoterápico (pasionaria).',
    indicaciones: 'Ansiedad leve, insomnio.',
    posologia: 'Extracto: según producto (típicamente 200–400 mg/día).',
    efectos_adversos: 'Somnolencia, mareo, náuseas.',
    contraindicaciones: 'Embarazo, depresores SNC concomitantes.',
    precauciones_adulto_mayor: 'Vigilar sedación y caídas.',
    interacciones: 'Depresores SNC, anticoagulantes.',
    conservacion: 'Temperatura ambiente.',
  },

  MELISA: {
    categoria: 'Fitoterápico calmante (toronjil).',
    indicaciones: 'Ansiedad leve, dispepsia funcional, insomnio.',
    posologia: 'Infusión o extracto según producto.',
    efectos_adversos: 'Somnolencia, malestar digestivo leve.',
    contraindicaciones: 'Hipotiroidismo (dosis altas — datos limitados).',
    precauciones_adulto_mayor: 'Buen perfil.',
    interacciones: 'Sedantes (potencia).',
    conservacion: 'Temperatura ambiente.',
  },

  MANZANILLA: {
    categoria: 'Fitoterápico antiespasmódico, calmante, antiinflamatorio leve.',
    indicaciones: 'Dispepsia, cólicos, ansiedad leve, irritación cutánea.',
    posologia: 'Infusión 1 bolsita 2–3 veces/día.',
    efectos_adversos: 'Alergia (familia asteráceas), raras reacciones cruzadas con ambrosía.',
    contraindicaciones: 'Alergia a asteráceas.',
    precauciones_adulto_mayor: 'Bien tolerada. Cautela con anticoagulantes a dosis altas.',
    interacciones: 'Warfarina (mínimo a dosis usuales).',
    conservacion: 'Temperatura ambiente, seco.',
  },

  ARNICA: {
    categoria: 'Fitoterápico tópico antiinflamatorio.',
    indicaciones: 'Contusiones, hematomas, dolor musculoesquelético (uso tópico).',
    posologia: 'Crema/gel: aplicar 2–3 veces/día sobre piel intacta.',
    efectos_adversos: 'Dermatitis alérgica de contacto. Tóxica si se ingiere.',
    contraindicaciones: 'Piel lesionada, ingesta, alergia a asteráceas.',
    precauciones_adulto_mayor: 'Sólo uso tópico. No aplicar bajo vendaje oclusivo.',
    interacciones: 'Anticoagulantes (uso tópico extenso).',
    conservacion: 'Temperatura ambiente.',
  },

  'ALOE VERA': {
    categoria: 'Fitoterápico tópico (gel) y laxante (acíbar — uso oral no recomendado).',
    indicaciones: 'Quemaduras solares leves, irritación cutánea, hidratación.',
    posologia: 'Gel tópico: aplicar varias veces/día.',
    efectos_adversos: 'Dermatitis de contacto. Oral: cólicos, alteraciones electrolíticas.',
    contraindicaciones: 'Embarazo, lactancia (vía oral). Hipersensibilidad.',
    precauciones_adulto_mayor: 'Sólo gel tópico de rutina.',
    interacciones: 'Vía oral: digoxina, diuréticos (hipokalemia).',
    conservacion: 'Refrigerar tras abrir prolonga vida útil.',
  },

  'CENTELLA ASIATICA': {
    categoria: 'Fitoterápico (gotu kola) — cicatrizante y venotónico.',
    indicaciones: 'Insuficiencia venosa, cicatrización, fragilidad capilar.',
    posologia: 'Extracto: 60–180 mg/día.',
    efectos_adversos: 'Náuseas, cefalea, raro hepatotoxicidad.',
    contraindicaciones: 'Hepatopatía, embarazo.',
    precauciones_adulto_mayor: 'Limitar a 6 semanas continuas.',
    interacciones: 'Sedantes (potencia), hepatotóxicos.',
    conservacion: 'Temperatura ambiente.',
  },

  PROPOLEO: {
    categoria: 'Producto apícola con actividad antiséptica y antiinflamatoria.',
    indicaciones: 'Faringitis, aftas, apoyo inmune (uso popular).',
    posologia: 'Spray/gotas tópicas o sublinguales según producto.',
    efectos_adversos: 'Alergia (a abejas/polen), dermatitis de contacto.',
    contraindicaciones: 'Alergia a productos apícolas, asma.',
    precauciones_adulto_mayor: 'Suspender ante cualquier reacción alérgica.',
    interacciones: 'Anticoagulantes (precaución).',
    conservacion: 'Temperatura ambiente, protegido luz.',
  },

  LACTOBACILLUS: {
    categoria: 'Probiótico (varias cepas: rhamnosus, reuteri, acidophilus).',
    indicaciones: 'Diarrea por antibióticos, gastroenteritis, vaginosis, apoyo digestivo.',
    posologia: 'Variable según cepa y producto.',
    efectos_adversos: 'Distensión, gases.',
    contraindicaciones: 'Inmunosupresión severa, catéteres centrales.',
    precauciones_adulto_mayor: 'Útil al asociar antibióticos (separar 2 h).',
    interacciones: 'Antibióticos.',
    conservacion: 'Refrigerar según envase.',
  },

  SACCHAROMYCES: {
    categoria: 'Probiótico levadura (S. boulardii).',
    indicaciones: 'Prevención de diarrea por antibióticos y por C. difficile, diarrea del viajero, colon irritable.',
    posologia: '250–500 mg 1–2 veces/día.',
    efectos_adversos: 'Distensión, gases.',
    contraindicaciones: 'Inmunosupresión severa, catéter venoso central (riesgo de fungemia).',
    precauciones_adulto_mayor: 'Útil al asociar antibióticos. Manejar fuera de habitaciones con pacientes con catéter central.',
    interacciones: 'Antifúngicos (reducen viabilidad).',
    conservacion: 'Temperatura ambiente o según envase.',
  },

  CRANBERRY: {
    categoria: 'Fitoterápico (arándano rojo).',
    indicaciones: 'Prevención de infecciones urinarias recurrentes.',
    posologia: 'Cápsulas estandarizadas según producto.',
    efectos_adversos: 'Malestar gástrico, cálculos de oxalato a dosis altas.',
    contraindicaciones: 'Litiasis oxálica activa.',
    precauciones_adulto_mayor: 'Útil como adyuvante en ITU recurrente. No reemplaza tratamiento antibiótico.',
    interacciones: 'Warfarina (puede aumentar INR — vigilar).',
    conservacion: 'Temperatura ambiente.',
  },

  MORINGA: {
    categoria: 'Fitoterápico (Moringa oleifera).',
    indicaciones: 'Apoyo nutricional, antioxidante. Evidencia clínica limitada.',
    posologia: 'Según producto.',
    efectos_adversos: 'Náuseas, diarrea a dosis altas.',
    contraindicaciones: 'Embarazo (corteza/raíz).',
    precauciones_adulto_mayor: 'Cautela con hipoglicemiantes y antihipertensivos (efecto aditivo posible).',
    interacciones: 'Antidiabéticos, antihipertensivos, levotiroxina.',
    conservacion: 'Temperatura ambiente.',
  },

  ECHINACEA: {
    categoria: 'Fitoterápico inmunomodulador.',
    indicaciones: 'Resfrío común (sintomático y duración).',
    posologia: 'Extracto según producto. No exceder 10 días continuos.',
    efectos_adversos: 'Náuseas, rash, raro reacciones alérgicas.',
    contraindicaciones: 'Enfermedades autoinmunes, inmunosupresión, alergia a asteráceas.',
    precauciones_adulto_mayor: 'Uso corto.',
    interacciones: 'Inmunosupresores.',
    conservacion: 'Temperatura ambiente.',
  },

  'CIMICIFUGA RACEMOSA': {
    categoria: 'Fitoterápico (cohosh negro) para síntomas menopáusicos.',
    indicaciones: 'Sofocos, sudoración de la menopausia.',
    posologia: '40 mg/día estandarizado.',
    efectos_adversos: 'Malestar gástrico. Casos reportados de hepatotoxicidad.',
    contraindicaciones: 'Hepatopatía, cáncer hormono-dependiente (debate).',
    precauciones_adulto_mayor: 'Limitar a 6 meses. Vigilar transaminasas.',
    interacciones: 'Hepatotóxicos.',
    conservacion: 'Temperatura ambiente.',
  },

  'CARDO MARIANO': {
    categoria: 'Fitoterápico hepatoprotector (silimarina).',
    indicaciones: 'Hepatopatías (apoyo), dispepsia funcional.',
    posologia: '140–420 mg silimarina/día.',
    efectos_adversos: 'Náuseas, diarrea, alergia (asteráceas).',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'No reemplaza tratamiento médico de hepatopatías.',
    interacciones: 'Puede modificar metabolismo CYP — vigilar warfarina.',
    conservacion: 'Temperatura ambiente.',
  },

  RESVERATROL: {
    categoria: 'Polifenol antioxidante.',
    indicaciones: 'Apoyo cardiovascular y antioxidante. Evidencia clínica limitada.',
    posologia: '100–500 mg/día.',
    efectos_adversos: 'Malestar gástrico a dosis altas.',
    contraindicaciones: 'Cáncer hormono-dependiente (precaución, efecto fitoestrogénico).',
    precauciones_adulto_mayor: 'Cautela con anticoagulantes.',
    interacciones: 'Warfarina, antiagregantes.',
    conservacion: 'Temperatura ambiente.',
  },

  'COLAGENO HIDROLIZADO': {
    categoria: 'Suplemento proteico.',
    indicaciones: 'Apoyo articular y cutáneo. Evidencia modesta.',
    posologia: '5–10 g/día disueltos en líquido.',
    efectos_adversos: 'Distensión, sabor desagradable.',
    contraindicaciones: 'Alergia a la fuente (pescado, bovino).',
    precauciones_adulto_mayor: 'Suplemento — no sustituye tratamiento de artrosis.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente, seco.',
  },

  'LEVADURA DE CERVEZA': {
    categoria: 'Suplemento nutricional (vitaminas B, cromo, selenio).',
    indicaciones: 'Apoyo nutricional, fortalecimiento de cabello y uñas.',
    posologia: 'Según producto.',
    efectos_adversos: 'Flatulencia.',
    contraindicaciones: 'Alergia a levaduras, enfermedad de Crohn activa.',
    precauciones_adulto_mayor: 'Bien tolerada.',
    interacciones: 'IMAOs (contenido de tiramina).',
    conservacion: 'Temperatura ambiente, seco.',
  },

  PSYLLIUM: {
    categoria: 'Fibra soluble (laxante formador de masa).',
    indicaciones: 'Estreñimiento crónico, síndrome de intestino irritable, hipercolesterolemia leve.',
    posologia: '5–10 g 1–3 veces/día con abundante agua.',
    efectos_adversos: 'Distensión, gases. Obstrucción si poca ingesta de agua.',
    contraindicaciones: 'Obstrucción intestinal, disfagia.',
    precauciones_adulto_mayor: 'Excelente primera línea para estreñimiento crónico. SIEMPRE con buen aporte de agua.',
    interacciones: 'Reduce absorción de varios fármacos (separar 2 h).',
    conservacion: 'Temperatura ambiente, seco.',
  },

  // ───────── Otros frecuentes ─────────
  ORLISTAT: {
    categoria: 'Inhibidor de lipasa pancreática.',
    indicaciones: 'Obesidad (con dieta hipocalórica).',
    posologia: '120 mg con cada comida principal (hasta 3 veces/día).',
    efectos_adversos: 'Esteatorrea, urgencia fecal, flatulencia con descarga oleosa, déficit de vitaminas liposolubles.',
    contraindicaciones: 'Síndrome de malabsorción crónica, colestasis, embarazo.',
    precauciones_adulto_mayor: 'Suplementar vitaminas liposolubles (separar de la dosis). Cautela con warfarina.',
    interacciones: 'Warfarina, levotiroxina, ciclosporina, antiepilépticos (separar 4 h).',
    conservacion: 'Temperatura ambiente.',
  },

  LEVOSULPIRIDA: {
    categoria: 'Antipsicótico/antiemético con efecto procinético.',
    indicaciones: 'Dispepsia funcional, reflujo, vértigo, somatización.',
    posologia: '25 mg 3 veces/día antes de comidas.',
    efectos_adversos: 'Hiperprolactinemia (galactorrea, amenorrea), extrapiramidales, sedación.',
    contraindicaciones: 'Prolactinoma, Parkinson, feocromocitoma.',
    precauciones_adulto_mayor: 'EVITAR uso prolongado por riesgo de extrapiramidalismo y discinesia tardía.',
    interacciones: 'Levodopa (antagonismo), prolongadores QT.',
    conservacion: 'Temperatura ambiente.',
  },

  'OTILONIO BROMURO': {
    categoria: 'Antiespasmódico digestivo (acción local).',
    indicaciones: 'Síndrome de intestino irritable, espasmo intestinal.',
    posologia: '40 mg 2–3 veces/día antes de comidas.',
    efectos_adversos: 'Muy pocos (mínima absorción sistémica): mareo, náusea leve.',
    contraindicaciones: 'Glaucoma de ángulo estrecho, hipertrofia prostática.',
    precauciones_adulto_mayor: 'Buena tolerancia por baja absorción.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  AVANAFILO: {
    categoria: 'Inhibidor de PDE5 (acción rápida).',
    indicaciones: 'Disfunción eréctil.',
    posologia: '50–200 mg 15–30 min antes de la actividad sexual.',
    efectos_adversos: 'Cefalea, sofocos, congestión nasal, dispepsia.',
    contraindicaciones: 'Uso de nitratos, riociguat, IAM/ACV reciente, hipotensión.',
    precauciones_adulto_mayor: 'Iniciar con 50 mg. Evitar combinación con nitratos por 48 h.',
    interacciones: 'Nitratos, alfabloqueantes (hipotensión), inhibidores CYP3A4.',
    conservacion: 'Temperatura ambiente.',
  },

  FENTERMINA: {
    categoria: 'Anorexígeno simpaticomimético.',
    indicaciones: 'Obesidad a corto plazo (<12 semanas) como apoyo.',
    posologia: '15–37,5 mg/día por la mañana.',
    efectos_adversos: 'Insomnio, taquicardia, hipertensión, ansiedad, dependencia.',
    contraindicaciones: 'HTA, cardiopatía, hipertiroidismo, glaucoma, IMAOs.',
    precauciones_adulto_mayor: 'EVITAR en adulto mayor por riesgo CV y de adicción.',
    interacciones: 'IMAOs, simpaticomiméticos, ISRS.',
    conservacion: 'Temperatura ambiente.',
  },

  PIROXICAM: {
    categoria: 'AINE de vida media larga.',
    indicaciones: 'Artrosis, artritis reumatoide (segunda línea).',
    posologia: '10–20 mg/día.',
    efectos_adversos: 'Mayor riesgo gastrointestinal y cutáneo (Stevens-Johnson) que otros AINEs.',
    contraindicaciones: 'Úlcera, sangrado, falla renal/hepática severa, embarazo (3er trimestre).',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers) por alto riesgo GI, renal y cutáneo. Preferir otros AINEs si imprescindible.',
    interacciones: 'Igual que otros AINEs.',
    conservacion: 'Temperatura ambiente.',
  },

  INDOMETACINA: {
    categoria: 'AINE potente.',
    indicaciones: 'Gota aguda, espondiloartritis, dolor severo.',
    posologia: '25–50 mg cada 8 h.',
    efectos_adversos: 'Cefalea (frecuente), confusión, gastritis, sangrado, falla renal.',
    contraindicaciones: 'Úlcera, falla renal, embarazo.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): SNC (cefalea, confusión), GI y renal.',
    interacciones: 'Igual que otros AINEs.',
    conservacion: 'Temperatura ambiente.',
  },

  FLURBIPROFENO: {
    categoria: 'AINE.',
    indicaciones: 'Dolor faríngeo (pastillas), dolor musculoesquelético (oral, gel).',
    posologia: 'Pastilla 8,75 mg cada 3–6 h, máximo 5 al día. Oral: 50–100 mg cada 6–8 h.',
    efectos_adversos: 'Locales: irritación oral. Sistémicos similares a otros AINEs.',
    contraindicaciones: 'Alergia a AINEs, úlcera activa, 3er trimestre embarazo.',
    precauciones_adulto_mayor: 'Limitar duración. Pastillas: irritación de mucosas.',
    interacciones: 'Igual que ibuprofeno.',
    conservacion: 'Temperatura ambiente.',
  },

  'NITRATO DE PLATA': {
    categoria: 'Cáustico/antiséptico tópico.',
    indicaciones: 'Cauterización de granulomas, verrugas, sangrado capilar nasal.',
    posologia: 'Aplicación puntual por personal entrenado.',
    efectos_adversos: 'Tinción cutánea negruzca (puede ser permanente), quemadura local.',
    contraindicaciones: 'Piel sana extensa, mucosa ocular.',
    precauciones_adulto_mayor: 'Uso por profesional.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente, protegido luz.',
  },

  'AZUL DE METILENO': {
    categoria: 'Antiséptico tintura/colorante diagnóstico.',
    indicaciones: 'Antisepsia bucal, marcado quirúrgico, metahemoglobinemia (IV).',
    posologia: 'Tópico según producto.',
    efectos_adversos: 'Tinción azul de piel/mucosas, raro síndrome serotoninérgico (IV con ISRS).',
    contraindicaciones: 'Déficit G6PD, embarazo, uso con ISRS/IRSN.',
    precauciones_adulto_mayor: 'Suspender ISRS antes del uso sistémico.',
    interacciones: 'ISRS, IRSN, IMAOs.',
    conservacion: 'Temperatura ambiente, protegido luz.',
  },

  'SAL INGLESA': {
    categoria: 'Sulfato de magnesio (laxante osmótico, baños).',
    indicaciones: 'Estreñimiento ocasional, baños relajantes, preparación de colonoscopia.',
    posologia: 'Oral: 5–10 g disueltos en agua. No usar de rutina.',
    efectos_adversos: 'Diarrea, deshidratación, hipermagnesemia.',
    contraindicaciones: 'Falla renal, obstrucción intestinal.',
    precauciones_adulto_mayor: 'EVITAR oral en falla renal. Preferir laxantes osmóticos más suaves.',
    interacciones: 'Reduce absorción de quinolonas, tetraciclinas (separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  'HOJAS DE SEN': {
    categoria: 'Laxante estimulante (sennósidos).',
    indicaciones: 'Estreñimiento ocasional.',
    posologia: '15–30 mg sennósidos/noche.',
    efectos_adversos: 'Cólicos, diarrea, hipopotasemia con uso crónico.',
    contraindicaciones: 'Obstrucción, embarazo.',
    precauciones_adulto_mayor: 'No usar más de 1–2 semanas continuas.',
    interacciones: 'Digoxina, diuréticos (hipokalemia).',
    conservacion: 'Temperatura ambiente.',
  },

  STEVIA: {
    categoria: 'Edulcorante natural no calórico.',
    indicaciones: 'Sustituto del azúcar, especialmente para diabéticos.',
    posologia: 'Según necesidad.',
    efectos_adversos: 'Bien tolerada.',
    contraindicaciones: 'Hipersensibilidad (rara).',
    precauciones_adulto_mayor: 'Útil para reducir azúcar añadida.',
    interacciones: 'Mínimas; potencial efecto hipotensor leve con antihipertensivos.',
    conservacion: 'Temperatura ambiente.',
  },

  SUCRALOSA: {
    categoria: 'Edulcorante no nutritivo.',
    indicaciones: 'Sustituto del azúcar.',
    posologia: 'Según necesidad.',
    efectos_adversos: 'Bien tolerada.',
    contraindicaciones: 'Hipersensibilidad (rara).',
    precauciones_adulto_mayor: 'Sin efecto significativo en glicemia.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Tópicos rubefacientes / rinitis ─────────
  ALCANFOR: {
    categoria: 'Rubefaciente y antitusígeno tópico.',
    indicaciones: 'Dolor muscular, congestión nasal (vahos), prurito leve. Componente común en bálsamos.',
    posologia: 'Uso tópico según producto. Vapor: 1–2 cdtas en agua caliente.',
    efectos_adversos: 'Irritación, dermatitis de contacto. Tóxico si se ingiere (convulsiones).',
    contraindicaciones: 'Niños <2 años (no aplicar en cara), piel lesionada, mucosas, ingesta.',
    precauciones_adulto_mayor: 'No aplicar bajo vendaje oclusivo. Lavar manos tras aplicar.',
    interacciones: 'Mínimas tópicas.',
    conservacion: 'Temperatura ambiente, envase cerrado.',
  },

  MENTOL: {
    categoria: 'Refrescante/rubefaciente tópico.',
    indicaciones: 'Prurito, dolor muscular, congestión nasal, mareos.',
    posologia: 'Uso tópico/inhalación según producto.',
    efectos_adversos: 'Irritación cutánea, alergia.',
    contraindicaciones: 'Niños pequeños (laringoespasmo), piel lesionada.',
    precauciones_adulto_mayor: 'Bien tolerado tópico.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  EUCALIPTO: {
    categoria: 'Aceite esencial expectorante/descongestionante.',
    indicaciones: 'Congestión nasal, tos productiva (vapor, ungüento).',
    posologia: 'Inhalación vapor o aplicación tópica según producto.',
    efectos_adversos: 'Irritación, broncoespasmo en asma.',
    contraindicaciones: 'Asma severa, niños <2 años, ingesta.',
    precauciones_adulto_mayor: 'Uso tópico/inhalado. No aplicar en mucosa nasal directa en niños.',
    interacciones: 'Inductor enzimático leve.',
    conservacion: 'Temperatura ambiente, protegido luz.',
  },

  'SALICILATO DE METILO': {
    categoria: 'Rubefaciente tópico (gaulteria).',
    indicaciones: 'Dolor muscular, contracturas.',
    posologia: 'Aplicación tópica 2–3 veces/día.',
    efectos_adversos: 'Irritación local, salicilismo si uso muy extenso.',
    contraindicaciones: 'Anticoagulación, alergia a salicilatos, piel lesionada, niños.',
    precauciones_adulto_mayor: 'EVITAR uso extenso si toma warfarina (absorción sistémica de salicilato).',
    interacciones: 'Warfarina (absorción).',
    conservacion: 'Temperatura ambiente.',
  },

  CALAMINA: {
    categoria: 'Astringente tópico (óxido de zinc + óxido férrico).',
    indicaciones: 'Prurito por picaduras, dermatitis leve, varicela.',
    posologia: 'Loción: aplicar varias veces/día.',
    efectos_adversos: 'Sequedad cutánea, rara alergia.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Bien tolerado.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente. Agitar antes de usar.',
  },

  DIFENHIDRAMINA: {
    categoria: 'Antihistamínico H1 de 1ª generación (sedante).',
    indicaciones: 'Alergia, prurito, insomnio ocasional, cinetosis.',
    posologia: '25–50 mg cada 4–6 h, máximo 300 mg/día. Tópico: aplicar PRN.',
    efectos_adversos: 'Somnolencia, boca seca, retención urinaria, taquicardia, confusión.',
    contraindicaciones: 'Glaucoma de ángulo estrecho, hipertrofia prostática, asma severa.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): anticolinérgico potente, caídas, confusión. Preferir 2ª generación.',
    interacciones: 'Depresores SNC, anticolinérgicos, IMAOs.',
    conservacion: 'Temperatura ambiente.',
  },

  CETILPIRIDINIO: {
    categoria: 'Antiséptico bucal (amonio cuaternario).',
    indicaciones: 'Gingivitis, faringitis, aftas (enjuagues, pastillas).',
    posologia: 'Enjuague o pastilla cada 3–6 h, máximo 1 semana.',
    efectos_adversos: 'Tinción dental con uso prolongado, alteración del gusto.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Uso corto.',
    interacciones: 'Pasta con SLS (separar).',
    conservacion: 'Temperatura ambiente.',
  },

  ALANTOINA: {
    categoria: 'Queratolítico/cicatrizante suave.',
    indicaciones: 'Heridas leves, irritación cutánea, dermatitis.',
    posologia: 'Crema 0,5–2%: aplicar varias veces/día.',
    efectos_adversos: 'Raros.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Bien tolerada.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Antibióticos tópicos ─────────
  BACITRACINA: {
    categoria: 'Antibiótico tópico (polipéptido).',
    indicaciones: 'Infecciones cutáneas superficiales, profilaxis de heridas.',
    posologia: 'Aplicar ungüento 1–3 veces/día.',
    efectos_adversos: 'Dermatitis de contacto, raro anafilaxia.',
    contraindicaciones: 'Hipersensibilidad. No en heridas extensas.',
    precauciones_adulto_mayor: 'Bien tolerada tópica corta.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  NEOMICINA: {
    categoria: 'Antibiótico aminoglucósido tópico.',
    indicaciones: 'Infecciones cutáneas, otológicas, oftalmológicas (combinada).',
    posologia: 'Tópico 2–3 veces/día.',
    efectos_adversos: 'Dermatitis de contacto frecuente, ototoxicidad si absorción sistémica (uso extenso).',
    contraindicaciones: 'Hipersensibilidad, perforación timpánica (otológico), heridas extensas.',
    precauciones_adulto_mayor: 'Limitar duración. Reacción alérgica frecuente en piel.',
    interacciones: 'Otros nefro/ototóxicos (absorción).',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Antiparkinsonianos ─────────
  LEVODOPA: {
    categoria: 'Precursor dopaminérgico (siempre combinado con carbidopa o benserazida).',
    indicaciones: 'Enfermedad de Parkinson.',
    posologia: 'Variable según presentación y respuesta. Iniciar con dosis bajas y titular.',
    efectos_adversos: 'Náuseas, hipotensión ortostática, discinesias, alucinaciones, fluctuaciones motoras, somnolencia.',
    contraindicaciones: 'Melanoma maligno, glaucoma de ángulo cerrado, psicosis severa, IMAOs no selectivos.',
    precauciones_adulto_mayor: 'Iniciar lento. Vigilar hipotensión, caídas y alucinaciones. NO suspender bruscamente (riesgo síndrome neuroléptico maligno).',
    interacciones: 'Antipsicóticos típicos, metoclopramida (antagonismo), proteínas (compiten absorción), antihipertensivos.',
    conservacion: 'Temperatura ambiente.',
  },

  CARBIDOPA: {
    categoria: 'Inhibidor de dopa-descarboxilasa periférica (siempre con levodopa).',
    indicaciones: 'Parkinson — reduce náuseas y aumenta biodisponibilidad cerebral de levodopa.',
    posologia: 'Combinada con levodopa según producto.',
    efectos_adversos: 'Mismos que levodopa.',
    contraindicaciones: 'Mismas que levodopa.',
    precauciones_adulto_mayor: 'Ver levodopa.',
    interacciones: 'Ver levodopa. Piridoxina sola reduce eficacia (pero no si hay carbidopa).',
    conservacion: 'Temperatura ambiente.',
  },

  BENSERAZIDA: {
    categoria: 'Inhibidor de dopa-descarboxilasa periférica (con levodopa).',
    indicaciones: 'Parkinson.',
    posologia: 'Combinada con levodopa según producto.',
    efectos_adversos: 'Mismos que levodopa.',
    contraindicaciones: 'Mismas que levodopa.',
    precauciones_adulto_mayor: 'Ver levodopa.',
    interacciones: 'Ver levodopa.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Inhalados ─────────
  BUDESONIDA: {
    categoria: 'Corticoide inhalado/nasal.',
    indicaciones: 'Asma persistente, EPOC con exacerbaciones frecuentes, rinitis alérgica.',
    posologia: 'Inhalado: 200–800 mcg/día divididos. Nasal: 1–2 nebulizaciones por fosa/día.',
    efectos_adversos: 'Candidiasis oral, disfonía, irritación. Sistémicos (dosis altas): hipogonadismo, osteoporosis.',
    contraindicaciones: 'Hipersensibilidad. Infección respiratoria activa no tratada.',
    precauciones_adulto_mayor: 'Enjuagar boca tras inhalar para prevenir candidiasis. Densitometría si uso prolongado a dosis altas.',
    interacciones: 'Inhibidores potentes CYP3A4 (ketoconazol, ritonavir).',
    conservacion: 'Temperatura ambiente.',
  },

  FORMOTEROL: {
    categoria: 'Broncodilatador beta-2 agonista de acción prolongada (LABA).',
    indicaciones: 'Asma (con corticoide inhalado), EPOC.',
    posologia: '4,5–12 mcg cada 12 h inhalado.',
    efectos_adversos: 'Temblor, palpitaciones, taquicardia, hipopotasemia, cefalea.',
    contraindicaciones: 'No usar como monoterapia en asma. Taquiarritmia severa.',
    precauciones_adulto_mayor: 'Vigilar frecuencia cardíaca y potasio. Siempre asociado a corticoide en asma.',
    interacciones: 'Diuréticos (hipokalemia), prolongadores QT, betabloqueantes.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Antibacterianos / antiparasitarios faltantes ─────────
  SULFAMETOXAZOL: {
    categoria: 'Sulfonamida (combinada con trimetoprim = cotrimoxazol).',
    indicaciones: 'ITU, sinusitis, neumonía por P. jirovecii (con TMP), infecciones cutáneas.',
    posologia: 'Cotrimoxazol 800/160 mg cada 12 h.',
    efectos_adversos: 'Rash (Stevens-Johnson raro), náuseas, hipercalemia, mielosupresión, falla renal, fotosensibilidad.',
    contraindicaciones: 'Alergia a sulfas, embarazo (3er trimestre), déficit G6PD, falla renal severa.',
    precauciones_adulto_mayor: 'Vigilar potasio, creatinina y hemograma. Riesgo de hipoglicemia con sulfonilureas. Bebida abundante.',
    interacciones: 'Warfarina (aumenta INR), sulfonilureas, metotrexato, IECA (hiperkalemia), fenitoína.',
    conservacion: 'Temperatura ambiente.',
  },

  TRIMETOPRIM: {
    categoria: 'Antibacteriano (suele combinarse con sulfametoxazol).',
    indicaciones: 'ITU.',
    posologia: 'Solo: 100–200 mg cada 12 h. Cotrimoxazol según indicación.',
    efectos_adversos: 'Rash, náuseas, hiperkalemia, déficit folato.',
    contraindicaciones: 'Anemia megaloblástica, hipersensibilidad.',
    precauciones_adulto_mayor: 'Vigilar potasio y creatinina.',
    interacciones: 'IECA/ARA II, espironolactona (hiperkalemia), metotrexato.',
    conservacion: 'Temperatura ambiente.',
  },

  TINIDAZOL: {
    categoria: 'Antiparasitario/antibacteriano nitroimidazol.',
    indicaciones: 'Tricomoniasis, giardiasis, amebiasis, vaginosis bacteriana.',
    posologia: '2 g dosis única (tricomoniasis, giardia) o 2 g/día por 3–5 días.',
    efectos_adversos: 'Náuseas, sabor metálico, cefalea, mareo, neuropatía con uso prolongado.',
    contraindicaciones: 'Embarazo (1er trimestre), discrasias sanguíneas, alergia a nitroimidazoles.',
    precauciones_adulto_mayor: 'EVITAR alcohol (efecto disulfiram).',
    interacciones: 'Alcohol, warfarina, litio, fenitoína.',
    conservacion: 'Temperatura ambiente.',
  },

  MICONAZOL: {
    categoria: 'Antifúngico imidazol tópico/vaginal.',
    indicaciones: 'Candidiasis cutánea, vaginal, oral (gel), dermatofitosis.',
    posologia: 'Crema 2%: 2 veces/día. Gel oral: 4 veces/día. Óvulo 1200 mg dosis única.',
    efectos_adversos: 'Irritación, prurito.',
    contraindicaciones: 'Hipersensibilidad. Gel oral: interacciones con warfarina, sulfonilureas (incluso tópico).',
    precauciones_adulto_mayor: 'Gel oral atraviesa mucosa — vigilar INR si toma warfarina.',
    interacciones: 'Warfarina, sulfonilureas, fenitoína, ergotamina.',
    conservacion: 'Temperatura ambiente.',
  },

  PAROXETINA: {
    categoria: 'Antidepresivo ISRS.',
    indicaciones: 'Depresión, ansiedad, TOC, pánico, TEPT.',
    posologia: '20–60 mg/día por la mañana.',
    efectos_adversos: 'Sequedad bucal, somnolencia, sudoración, disfunción sexual, ganancia de peso, hiponatremia, síndrome de retiro pronunciado.',
    contraindicaciones: 'IMAOs, embarazo (1er trimestre).',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers): carga anticolinérgica más alta que otros ISRS, hiponatremia, caídas. Preferir sertralina o escitalopram.',
    interacciones: 'IMAOs, tamoxifeno (reduce activación — evitar), AINEs (sangrado), tramadol, triptanes.',
    conservacion: 'Temperatura ambiente.',
  },

  PIRIDOXINA: {
    categoria: 'Vitamina B6.',
    indicaciones: 'Déficit, prevención de neuropatía por isoniacida, náuseas del embarazo, anemia sideroblástica.',
    posologia: '10–50 mg/día. No exceder 100 mg/día crónico.',
    efectos_adversos: 'Dosis altas (>200 mg/día prolongado): neuropatía sensorial.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Limitar a 50 mg/día. Útil con isoniacida.',
    interacciones: 'Levodopa sola (antagoniza — pero no si hay carbidopa), fenitoína.',
    conservacion: 'Temperatura ambiente, protegido luz.',
  },

  DOXILAMINA: {
    categoria: 'Antihistamínico H1 de 1ª generación (sedante).',
    indicaciones: 'Insomnio ocasional, náuseas del embarazo (con piridoxina).',
    posologia: '12,5–25 mg al acostarse.',
    efectos_adversos: 'Somnolencia diurna, boca seca, retención urinaria, confusión.',
    contraindicaciones: 'Glaucoma de ángulo estrecho, hipertrofia prostática, lactancia.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers — anticolinérgico, caídas).',
    interacciones: 'Depresores SNC, anticolinérgicos, IMAOs.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Oftálmicos lubricantes ─────────
  HIPROMELOSA: {
    categoria: 'Lubricante oftálmico (hidroxipropilmetilcelulosa).',
    indicaciones: 'Ojo seco, irritación ocular.',
    posologia: '1 gota varias veces al día.',
    efectos_adversos: 'Visión borrosa transitoria, irritación leve.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Preferir sin preservantes para uso crónico.',
    interacciones: 'Separar 10 min de otros colirios.',
    conservacion: 'Temperatura ambiente.',
  },

  DEXTRAN: {
    categoria: 'Lubricante oftálmico (con HPMC).',
    indicaciones: 'Ojo seco, irritación ocular.',
    posologia: '1 gota varias veces al día.',
    efectos_adversos: 'Visión borrosa transitoria.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Preferir sin preservantes para uso frecuente.',
    interacciones: 'Separar 10 min de otros colirios.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Antiácidos / antidiarreicos faltantes ─────────
  'SUBSALICILATO BISMUTO': {
    categoria: 'Antidiarreico/antiácido (bismuto).',
    indicaciones: 'Diarrea del viajero, dispepsia, H. pylori (cuádruple terapia).',
    posologia: '525 mg cada 30–60 min PRN, máximo 4,2 g/día.',
    efectos_adversos: 'Lengua negra, deposiciones negras, salicilismo (uso prolongado).',
    contraindicaciones: 'Alergia a salicilatos, gota, falla renal, embarazo.',
    precauciones_adulto_mayor: 'Cautela con anticoagulantes. No prolongar.',
    interacciones: 'Warfarina, quinolonas, tetraciclinas (separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  ATAPULGITA: {
    categoria: 'Adsorbente intestinal.',
    indicaciones: 'Diarrea aguda no infecciosa.',
    posologia: '1,2–1,5 g tras cada deposición, máximo 9 g/día.',
    efectos_adversos: 'Estreñimiento.',
    contraindicaciones: 'Obstrucción intestinal.',
    precauciones_adulto_mayor: 'Hidratación adecuada. Reduce absorción de fármacos (separar 2 h).',
    interacciones: 'Digoxina, quinolonas, levotiroxina (separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  NIFUROXAZIDA: {
    categoria: 'Antibacteriano intestinal (nitrofurano).',
    indicaciones: 'Diarrea aguda bacteriana sin signos sistémicos.',
    posologia: '200 mg cada 6 h por máximo 7 días.',
    efectos_adversos: 'Rash, granulocitopenia rara, reacciones de hipersensibilidad.',
    contraindicaciones: 'Hipersensibilidad a nitrofuranos.',
    precauciones_adulto_mayor: 'Limitar a 7 días.',
    interacciones: 'Pocas (absorción mínima).',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Atropina / otros ─────────
  ATROPINA: {
    categoria: 'Anticolinérgico/antimuscarínico.',
    indicaciones: 'Bradicardia sintomática, intoxicación por organofosforados, midriasis diagnóstica (colirio), espasmo digestivo.',
    posologia: 'Variable según indicación y vía.',
    efectos_adversos: 'Boca seca, midriasis, taquicardia, retención urinaria, confusión.',
    contraindicaciones: 'Glaucoma de ángulo estrecho, hipertrofia prostática, megacolon, miastenia.',
    precauciones_adulto_mayor: 'EVITAR uso sistémico (criterios Beers — alta carga anticolinérgica). Colirio: midriasis prolongada.',
    interacciones: 'Otros anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  PAPAVERINA: {
    categoria: 'Antiespasmódico musculotrópico.',
    indicaciones: 'Espasmo visceral, cólicos.',
    posologia: '100–300 mg/día divididos.',
    efectos_adversos: 'Somnolencia, mareo, taquicardia, hipotensión, hepatotoxicidad.',
    contraindicaciones: 'Bloqueo AV, hipersensibilidad.',
    precauciones_adulto_mayor: 'Cautela por hipotensión.',
    interacciones: 'Levodopa (antagonismo), antihipertensivos.',
    conservacion: 'Temperatura ambiente.',
  },

  CLORDIAZEPOXIDO: {
    categoria: 'Benzodiacepina (BZD) de acción prolongada.',
    indicaciones: 'Ansiedad, abstinencia alcohólica, espasmo intestinal (combinado).',
    posologia: '5–25 mg 2–4 veces/día.',
    efectos_adversos: 'Sedación, ataxia, dependencia, amnesia.',
    contraindicaciones: 'Miastenia, glaucoma de ángulo estrecho, apnea severa.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers — BZD larga acción): caídas, fracturas, confusión. Preferir alternativas no-BZD.',
    interacciones: 'Depresores SNC, opioides (contraindicado salvo necesidad estricta).',
    conservacion: 'Temperatura ambiente.',
  },

  CLIDINIO: {
    categoria: 'Anticolinérgico antimuscarínico (combinado con clordiazepóxido para intestino irritable).',
    indicaciones: 'Síndrome de intestino irritable con componente ansioso.',
    posologia: '2,5 mg 3–4 veces/día.',
    efectos_adversos: 'Boca seca, visión borrosa, retención urinaria, taquicardia.',
    contraindicaciones: 'Glaucoma de ángulo estrecho, hipertrofia prostática, megacolon.',
    precauciones_adulto_mayor: 'EVITAR (criterios Beers — anticolinérgico).',
    interacciones: 'Otros anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── OTC misceláneos ─────────
  AZUFRE: {
    categoria: 'Antimicrobiano/queratolítico tópico.',
    indicaciones: 'Acné, rosácea, sarna, dermatitis seborreica.',
    posologia: 'Loción/jabón 2–10%: 1–2 veces/día.',
    efectos_adversos: 'Irritación, descamación, olor desagradable.',
    contraindicaciones: 'Piel muy sensible, hipersensibilidad.',
    precauciones_adulto_mayor: 'Bien tolerado.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  EUGENOL: {
    categoria: 'Anestésico/antiséptico dental (aceite de clavo).',
    indicaciones: 'Dolor dental ocasional, cementos dentales.',
    posologia: 'Aplicar pequeña cantidad sobre pieza afectada.',
    efectos_adversos: 'Irritación de mucosa.',
    contraindicaciones: 'Hipersensibilidad, niños pequeños.',
    precauciones_adulto_mayor: 'Uso puntual. Consultar dentista.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  'AC UNDECILENICO': {
    categoria: 'Antifúngico tópico.',
    indicaciones: 'Tiña pedis, intertrigo candidiásico, dermatofitosis.',
    posologia: 'Polvo/crema 5–25%: 2 veces/día.',
    efectos_adversos: 'Irritación local.',
    contraindicaciones: 'Hipersensibilidad. Piel agrietada extensa.',
    precauciones_adulto_mayor: 'Útil para pie de atleta.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  ALQUITRAN: {
    categoria: 'Antipruriginoso/queratoplástico (alquitrán de hulla).',
    indicaciones: 'Psoriasis, dermatitis seborreica.',
    posologia: 'Champú/loción según producto.',
    efectos_adversos: 'Irritación, fotosensibilidad, tinción cutánea/textil.',
    contraindicaciones: 'Piel inflamada aguda, foliculitis.',
    precauciones_adulto_mayor: 'Aplicar de noche. Protector solar.',
    interacciones: 'Otros fotosensibilizantes.',
    conservacion: 'Temperatura ambiente.',
  },

  ALUMBRE: {
    categoria: 'Astringente/hemostático tópico.',
    indicaciones: 'Sudoración excesiva, pequeños cortes hemostáticos.',
    posologia: 'Aplicar sobre piel limpia.',
    efectos_adversos: 'Irritación.',
    contraindicaciones: 'Piel lesionada extensa.',
    precauciones_adulto_mayor: 'Bien tolerado.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  ALOINA: {
    categoria: 'Laxante antraquinónico (de áloe).',
    indicaciones: 'Estreñimiento ocasional.',
    posologia: 'Según producto.',
    efectos_adversos: 'Cólicos, diarrea, hipopotasemia con uso crónico.',
    contraindicaciones: 'Obstrucción intestinal, embarazo.',
    precauciones_adulto_mayor: 'EVITAR uso crónico.',
    interacciones: 'Digoxina, diuréticos (hipokalemia).',
    conservacion: 'Temperatura ambiente.',
  },

  LINAZA: {
    categoria: 'Fibra/laxante formador de masa (semillas de lino).',
    indicaciones: 'Estreñimiento, hipercolesterolemia leve.',
    posologia: '1–2 cdas trituradas con abundante agua.',
    efectos_adversos: 'Distensión.',
    contraindicaciones: 'Obstrucción intestinal, disfagia.',
    precauciones_adulto_mayor: 'Aporte abundante de agua. Separar 1 h de medicamentos.',
    interacciones: 'Puede reducir absorción de fármacos.',
    conservacion: 'Temperatura ambiente, seco.',
  },

  FENOL: {
    categoria: 'Antiséptico/anestésico local tópico.',
    indicaciones: 'Antisepsia, dolor faríngeo (pastillas y spray).',
    posologia: 'Según producto, uso corto.',
    efectos_adversos: 'Irritación, toxicidad sistémica si extenso.',
    contraindicaciones: 'Piel lesionada extensa, niños pequeños.',
    precauciones_adulto_mayor: 'Limitar duración.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  VASELINA: {
    categoria: 'Emoliente/oclusivo (petrolato).',
    indicaciones: 'Piel seca, fisuras, dermatitis del pañal, lubricación.',
    posologia: 'Aplicar capa fina según necesidad.',
    efectos_adversos: 'Foliculitis ocasional.',
    contraindicaciones: 'Hipersensibilidad rara.',
    precauciones_adulto_mayor: 'Excelente barrera. No usar como lubricante con preservativos de látex.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  SILICONA: {
    categoria: 'Apósito de silicona / antiespumante (oral: simeticona).',
    indicaciones: 'Cicatrices hipertróficas, queloides (gel/láminas). Antiespumante: simeticona (ver).',
    posologia: 'Aplicar 2 veces/día por 2–3 meses.',
    efectos_adversos: 'Locales raros.',
    contraindicaciones: 'Heridas abiertas.',
    precauciones_adulto_mayor: 'Bien tolerada.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  'MIRISTATO DE ISOPROPILO': {
    categoria: 'Emoliente y vehículo cosmético.',
    indicaciones: 'Hidratación cutánea, vehículo para cremas.',
    posologia: 'Según producto.',
    efectos_adversos: 'Comedogénico en piel acneica.',
    contraindicaciones: 'Acné severo (cara).',
    precauciones_adulto_mayor: 'Bien tolerado.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  PANTENOL: {
    categoria: 'Provitamina B5 (ver dexpantenol).',
    indicaciones: 'Hidratación cutánea, regeneración epitelial.',
    posologia: 'Aplicar varias veces/día.',
    efectos_adversos: 'Raras alergias.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Bien tolerado.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  PAPAINA: {
    categoria: 'Enzima proteolítica (papaya).',
    indicaciones: 'Desbridamiento de heridas, antiinflamatorio enzimático.',
    posologia: 'Según producto.',
    efectos_adversos: 'Alergia, irritación.',
    contraindicaciones: 'Alergia al látex/papaya.',
    precauciones_adulto_mayor: 'Útil en heridas con tejido necrótico.',
    interacciones: 'Anticoagulantes (vigilar).',
    conservacion: 'Refrigerar según envase.',
  },

  'FLUORURO DE SODIO': {
    categoria: 'Anticaries (fluoruro).',
    indicaciones: 'Prevención de caries (enjuague, pasta).',
    posologia: 'Enjuague 0,05%: diario; 0,2%: semanal.',
    efectos_adversos: 'Fluorosis con ingesta excesiva crónica.',
    contraindicaciones: 'Niños <6 años (enjuague), hipersensibilidad.',
    precauciones_adulto_mayor: 'Útil para prevención de caries radiculares. No tragar.',
    interacciones: 'Calcio, magnesio (reducen absorción si oral).',
    conservacion: 'Temperatura ambiente.',
  },

  // ───────── Multinutrientes / fitos ─────────
  'POLIVITAMINICO': {
    categoria: 'Suplemento de vitaminas y minerales.',
    indicaciones: 'Apoyo nutricional en déficit dietético, recuperación, edad avanzada.',
    posologia: 'Según producto (típicamente 1 al día con comida).',
    efectos_adversos: 'Náuseas, sabor metálico. Hipervitaminosis con dosis altas crónicas (A, D, B6).',
    contraindicaciones: 'Hipervitaminosis, hemocromatosis (si contiene hierro).',
    precauciones_adulto_mayor: 'Útil cuando la dieta es insuficiente. Vigilar interacciones con levotiroxina, bifosfonatos.',
    interacciones: 'Levotiroxina, quinolonas, tetraciclinas, bifosfonatos (separar 2–4 h).',
    conservacion: 'Temperatura ambiente, seco.',
  },

  HAMAMELIS: {
    categoria: 'Fitoterápico astringente y venotónico.',
    indicaciones: 'Hemorroides, insuficiencia venosa, irritación cutánea.',
    posologia: 'Crema/loción según producto.',
    efectos_adversos: 'Irritación local rara.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Útil en hemorroides leves.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  ESPINO: {
    categoria: 'Fitoterápico cardiovascular (Crataegus).',
    indicaciones: 'Insuficiencia cardíaca leve (apoyo), palpitaciones funcionales.',
    posologia: 'Extracto: 160–900 mg/día.',
    efectos_adversos: 'Náuseas, mareo.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Coadyuvante — no reemplaza tratamiento de IC.',
    interacciones: 'Digoxina (potencia efecto cardiotónico), antihipertensivos.',
    conservacion: 'Temperatura ambiente.',
  },

  PROPIFENAZONA: {
    categoria: 'Analgésico/antipirético pirazolona.',
    indicaciones: 'Dolor leve a moderado, cefalea.',
    posologia: '150–300 mg cada 6–8 h.',
    efectos_adversos: 'Rash, raras citopenias.',
    contraindicaciones: 'Alergia a pirazolonas, déficit G6PD.',
    precauciones_adulto_mayor: 'Disponibilidad limitada — preferir paracetamol.',
    interacciones: 'Anticoagulantes.',
    conservacion: 'Temperatura ambiente.',
  },

  BENZOCAINA: {
    categoria: 'Anestésico local tipo éster.',
    indicaciones: 'Dolor de garganta, encías, picazón, hemorroides (tópico).',
    posologia: 'Según producto. No usar más de 7 días.',
    efectos_adversos: 'Sensibilización, metahemoglobinemia (rara — niños).',
    contraindicaciones: 'Alergia a anestésicos ésteres, niños <2 años.',
    precauciones_adulto_mayor: 'Uso corto. Suspender si aparece sensibilización.',
    interacciones: 'Sulfonamidas (antagonismo).',
    conservacion: 'Temperatura ambiente.',
  },

  XILOMETAZOLINA: {
    categoria: 'Descongestionante nasal alfa-adrenérgico.',
    indicaciones: 'Congestión nasal aguda.',
    posologia: '1–2 sprays cada 8–12 h, máximo 5 días.',
    efectos_adversos: 'Rinitis medicamentosa, sequedad nasal, hipertensión.',
    contraindicaciones: 'HTA, glaucoma, IMAOs.',
    precauciones_adulto_mayor: 'EVITAR uso prolongado.',
    interacciones: 'IMAOs.',
    conservacion: 'Temperatura ambiente.',
  },

  ANTAZOLINA: {
    categoria: 'Antihistamínico H1 (colirio).',
    indicaciones: 'Conjuntivitis alérgica.',
    posologia: '1 gota cada 6 h.',
    efectos_adversos: 'Escozor, midriasis leve.',
    contraindicaciones: 'Glaucoma de ángulo estrecho.',
    precauciones_adulto_mayor: 'Limitar a 1 semana.',
    interacciones: 'Anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  MOMETASONA: {
    categoria: 'Corticoide tópico/nasal de alta potencia.',
    indicaciones: 'Rinitis alérgica (spray), dermatosis inflamatorias (crema).',
    posologia: 'Nasal: 2 nebulizaciones por fosa/día. Crema 0,1%: 1 vez/día.',
    efectos_adversos: 'Epistaxis, sequedad nasal (spray). Atrofia cutánea con uso prolongado.',
    contraindicaciones: 'Infección no tratada en zona, hipersensibilidad.',
    precauciones_adulto_mayor: 'Spray nasal seguro a largo plazo en rinitis. Crema: no en cara/pliegues sin control.',
    interacciones: 'Inhibidores potentes CYP3A4 sistémicos.',
    conservacion: 'Temperatura ambiente.',
  },

  PENICILINA: {
    categoria: 'Antibiótico betalactámico (benzatínica, sódica, procaínica).',
    indicaciones: 'Sífilis, faringoamigdalitis estreptocócica, profilaxis fiebre reumática.',
    posologia: 'Benzatínica: 1,2–2,4 MUI IM dosis única o cada 3–4 semanas según indicación.',
    efectos_adversos: 'Dolor en sitio de inyección, anafilaxia, reacción Jarisch-Herxheimer en sífilis.',
    contraindicaciones: 'Alergia a penicilinas.',
    precauciones_adulto_mayor: 'Vigilar reacción inmediata 30 min post-inyección.',
    interacciones: 'Probenecid (aumenta niveles), metotrexato.',
    conservacion: 'Refrigerar reconstituida.',
  },

  SELENIO: {
    categoria: 'Oligoelemento antioxidante.',
    indicaciones: 'Déficit, apoyo tiroideo (tiroiditis autoinmune), soporte antioxidante.',
    posologia: '50–200 mcg/día. No exceder 400 mcg/día.',
    efectos_adversos: 'Selenosis (aliento a ajo, alopecia, neuropatía) por exceso crónico.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'No exceder 200 mcg/día.',
    interacciones: 'Anticoagulantes (vigilar a dosis altas).',
    conservacion: 'Temperatura ambiente.',
  },

  SODIO: {
    categoria: 'Electrolito (cloruro de sodio).',
    indicaciones: 'Reposición de sodio en hiponatremia, deshidratación.',
    posologia: 'Variable según indicación médica.',
    efectos_adversos: 'Sobrecarga de sodio, hipertensión, edema.',
    contraindicaciones: 'Hipertensión no controlada, IC, falla renal.',
    precauciones_adulto_mayor: 'Vigilar PA y edema. Dieta hiposódica recomendada en HTA/IC.',
    interacciones: 'Litio (reducción de niveles), corticoides.',
    conservacion: 'Temperatura ambiente.',
  },

  'FOSFATO SODIO': {
    categoria: 'Laxante osmótico salino. Suplementación de fósforo.',
    indicaciones: 'Estreñimiento agudo (enema), preparación intestinal, hipofosfatemia.',
    posologia: 'Enema 133 ml: rectal en adulto. Oral: según indicación.',
    efectos_adversos: 'Cólicos, deshidratación, hiperfosfatemia, hipocalcemia, falla renal aguda (oral en preparación).',
    contraindicaciones: 'Falla renal, deshidratación, obstrucción, megacolon, IC.',
    precauciones_adulto_mayor: 'EVITAR vía oral para preparación intestinal por riesgo renal. Enema seguro como rescate puntual.',
    interacciones: 'IECA/ARA II, AINEs, diuréticos (potencian riesgo renal).',
    conservacion: 'Temperatura ambiente.',
  },

  SOJA: {
    categoria: 'Fitoestrógenos (isoflavonas de soja).',
    indicaciones: 'Síntomas climatéricos leves, dislipidemia.',
    posologia: '40–80 mg isoflavonas/día.',
    efectos_adversos: 'Molestias gástricas, mastalgia.',
    contraindicaciones: 'Cáncer hormono-dependiente activo (debate), embarazo.',
    precauciones_adulto_mayor: 'Coadyuvante; efecto modesto en sofocos.',
    interacciones: 'Tamoxifeno, anticoagulantes, levotiroxina (separar 4 h).',
    conservacion: 'Temperatura ambiente.',
  },

  PALTO: {
    categoria: 'Aceite/extracto de palta (Persea gratissima).',
    indicaciones: 'Apoyo dermatológico, antiinflamatorio leve (tópico).',
    posologia: 'Según producto.',
    efectos_adversos: 'Raros.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Bien tolerado tópico.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  MIEL: {
    categoria: 'Apícola tópico/oral.',
    indicaciones: 'Tos (calmante de garganta), heridas superficiales.',
    posologia: 'Oral: 1 cda PRN. Tópico: aplicar sobre la herida.',
    efectos_adversos: 'Alergia (rara).',
    contraindicaciones: 'Niños <1 año (riesgo de botulismo), alergia.',
    precauciones_adulto_mayor: 'Útil para tos nocturna. Cuidado con la glicemia en diabetes.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  CONSUELDA: {
    categoria: 'Fitoterápico tópico (Symphytum officinale).',
    indicaciones: 'Contusiones, esguinces, dolor articular (tópico).',
    posologia: 'Crema/gel: aplicar 2–3 veces/día. Solo uso tópico.',
    efectos_adversos: 'Alergia local. Oral: hepatotoxicidad (no usar oralmente).',
    contraindicaciones: 'Heridas abiertas, embarazo, lactancia, vía oral.',
    precauciones_adulto_mayor: 'Solo tópico, máximo 4–6 semanas.',
    interacciones: 'Mínimas tópicas.',
    conservacion: 'Temperatura ambiente.',
  },

  'PROTECTOR SOLAR': {
    categoria: 'Filtro solar químico/físico.',
    indicaciones: 'Prevención de daño solar, fotoenvejecimiento, fotosensibilidad.',
    posologia: 'Aplicar 15–30 min antes de exposición. Reaplicar cada 2 h o tras baño/sudor.',
    efectos_adversos: 'Dermatitis de contacto, alergia (especialmente con PABA).',
    contraindicaciones: 'Hipersensibilidad al filtro específico.',
    precauciones_adulto_mayor: 'Uso diario en cara/cuello/manos. Mejor opción para prevenir queratosis actínica y cáncer cutáneo.',
    interacciones: 'Mínimas tópicas.',
    conservacion: 'Temperatura ambiente.',
  },

  EMOLIENTE: {
    categoria: 'Hidratante/oclusivo cutáneo.',
    indicaciones: 'Piel seca, fisuras, eccema, prevención de roces.',
    posologia: 'Aplicar varias veces al día.',
    efectos_adversos: 'Raros.',
    contraindicaciones: 'Hipersensibilidad al componente.',
    precauciones_adulto_mayor: 'Base del cuidado de piel envejecida.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  'FITO VENOTONICO': {
    categoria: 'Fitoterápico venotónico (castaño de indias, bursa pastoris).',
    indicaciones: 'Insuficiencia venosa, varices, hemorroides.',
    posologia: 'Extracto según producto.',
    efectos_adversos: 'Náuseas, prurito, raros.',
    contraindicaciones: 'Hipersensibilidad. Hepatopatía con uso prolongado.',
    precauciones_adulto_mayor: 'Coadyuvante a medidas físicas.',
    interacciones: 'Anticoagulantes (vigilar).',
    conservacion: 'Temperatura ambiente.',
  },

  'FITO ANTIDIARREICO': {
    categoria: 'Fitoterápico astringente (guayaba, etc.).',
    indicaciones: 'Diarrea leve.',
    posologia: 'Según producto.',
    efectos_adversos: 'Estreñimiento si exceso.',
    contraindicaciones: 'Diarrea con fiebre o sangre.',
    precauciones_adulto_mayor: 'Hidratación adecuada.',
    interacciones: 'Reduce absorción de fármacos (separar 2 h).',
    conservacion: 'Temperatura ambiente.',
  },

  'FITO BUCAL': {
    categoria: 'Fitoterápico bucal (clavo de olor, limón, melisa).',
    indicaciones: 'Halitosis, irritación bucal, faringitis leve.',
    posologia: 'Según producto.',
    efectos_adversos: 'Irritación de mucosa.',
    contraindicaciones: 'Hipersensibilidad.',
    precauciones_adulto_mayor: 'Bien tolerado.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  'FITO ESPASMOLITICO': {
    categoria: 'Fitoterápico anticolinérgico (belladona).',
    indicaciones: 'Espasmo digestivo, cólicos leves.',
    posologia: 'Según producto. Uso corto.',
    efectos_adversos: 'Boca seca, taquicardia, midriasis.',
    contraindicaciones: 'Glaucoma de ángulo estrecho, hipertrofia prostática, taquiarritmia.',
    precauciones_adulto_mayor: 'EVITAR — alta carga anticolinérgica.',
    interacciones: 'Otros anticolinérgicos.',
    conservacion: 'Temperatura ambiente.',
  },

  'TOPICO RESPIRATORIO': {
    categoria: 'Bálsamo tópico expectorante (clorocarvacrol, hígado bacalao, lanolina).',
    indicaciones: 'Congestión y tos en resfrío (frotación pecho/espalda).',
    posologia: 'Aplicar sobre tórax 2–3 veces/día.',
    efectos_adversos: 'Irritación local.',
    contraindicaciones: 'Mucosas, niños <2 años.',
    precauciones_adulto_mayor: 'Uso tópico. No ingerir.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  HOMEOPATICO: {
    categoria: 'Producto homeopático.',
    indicaciones: 'Según fórmula. Evidencia clínica limitada.',
    posologia: 'Según envase.',
    efectos_adversos: 'Generalmente nulos por alta dilución.',
    contraindicaciones: 'Hipersensibilidad a excipientes.',
    precauciones_adulto_mayor: 'No reemplaza tratamiento médico convencional.',
    interacciones: 'Mínimas.',
    conservacion: 'Temperatura ambiente.',
  },

  'LAXANTE ESTIMULANTE': {
    categoria: 'Laxante estimulante (antraquinónico/difenólico).',
    indicaciones: 'Estreñimiento ocasional.',
    posologia: 'Según producto, al acostarse.',
    efectos_adversos: 'Cólicos, diarrea, hipopotasemia.',
    contraindicaciones: 'Obstrucción intestinal, embarazo.',
    precauciones_adulto_mayor: 'No usar más de 1–2 semanas. Preferir osmóticos.',
    interacciones: 'Digoxina, diuréticos.',
    conservacion: 'Temperatura ambiente.',
  },

  'LAXANTE NATURAL': {
    categoria: 'Laxante de origen natural (ciruela, linaza, hierbas + miel).',
    indicaciones: 'Estreñimiento leve.',
    posologia: 'Según producto.',
    efectos_adversos: 'Distensión, gases.',
    contraindicaciones: 'Obstrucción, disfagia (productos con fibra).',
    precauciones_adulto_mayor: 'Bien tolerado. Hidratación abundante.',
    interacciones: 'Reduce absorción de fármacos (separar 1 h).',
    conservacion: 'Temperatura ambiente.',
  },

  // ──────────────────────────────────────────────────────────────────────
  // Suplementos / nutracéuticos adicionales
  // ──────────────────────────────────────────────────────────────────────

  GLUCOSAMINA: {
    categoria: 'Aminoazúcar precursor de glicosaminoglicanos del cartílago. Suplemento nutricional condroprotector.',
    indicaciones: 'Apoyo nutricional en artrosis leve a moderada de rodilla. Uso tradicional para alivio sintomático del dolor articular y mejora de la movilidad. La evidencia clínica es variable según presentación (sulfato vs clorhidrato).',
    posologia: 'Adultos: 1500 mg al día (en una toma única o repartidos). Tomar con alimentos. Efecto sintomático puede tardar 4–8 semanas.',
    efectos_adversos: 'Generalmente bien tolerado. Molestias gástricas leves, náuseas, distensión abdominal. Raramente cefalea, somnolencia.',
    contraindicaciones: 'Alergia a mariscos o crustáceos (la mayoría se extrae de caparazones). Embarazo y lactancia (datos insuficientes).',
    precauciones_adulto_mayor: 'Útil como complemento al manejo de artrosis, especialmente cuando se desea reducir uso de AINEs. Monitorear glicemia en personas con diabetes (puede afectar levemente el control glucémico). Verificar alergia a mariscos.',
    interacciones: 'Warfarina (reportes de aumento del INR — controlar coagulación). Antidiabéticos (vigilar glicemia).',
    conservacion: 'Temperatura ambiente, protegido de humedad.',
  },

  CONDROITINA: {
    categoria: 'Glicosaminoglicano natural del cartílago articular. Suplemento condroprotector, frecuentemente combinado con glucosamina.',
    indicaciones: 'Apoyo nutricional en artrosis. Uso tradicional para alivio del dolor articular y soporte de la matriz cartilaginosa.',
    posologia: 'Adultos: 800–1200 mg al día, en una o dos tomas. Tomar con alimentos. Efecto puede tardar 4–8 semanas en evidenciarse.',
    efectos_adversos: 'Bien tolerado. Molestias gástricas, náuseas, estreñimiento o diarrea leves.',
    contraindicaciones: 'Hipersensibilidad. Embarazo y lactancia (datos insuficientes). Cautela en asma (reportes anecdóticos).',
    precauciones_adulto_mayor: 'Complemento útil en artrosis. La mayoría se obtiene de cartílago bovino, porcino o de tiburón — verificar origen si hay preocupaciones dietarias o alergias.',
    interacciones: 'Warfarina (puede aumentar el INR — controlar coagulación).',
    conservacion: 'Temperatura ambiente.',
  },

  DIOSMINA: {
    categoria: 'Flavonoide cítrico semisintético. Venotónico y vasoprotector de uso tradicional.',
    indicaciones: 'Apoyo en síntomas de insuficiencia venosa crónica: pesadez de piernas, edema, dolor, calambres nocturnos. Coadyuvante en hemorroides agudas y crónicas.',
    posologia: 'Adultos: 450–900 mg al día (frecuentemente combinada con hesperidina). En crisis hemorroidal: hasta 2700–3000 mg/día los primeros 4 días, luego dosis de mantenimiento. Tomar con alimentos.',
    efectos_adversos: 'Bien tolerada. Molestias gástricas, náuseas, diarrea leve, cefalea ocasional.',
    contraindicaciones: 'Hipersensibilidad. Embarazo y lactancia (datos limitados — consultar profesional).',
    precauciones_adulto_mayor: 'Útil para síntomas de insuficiencia venosa, frecuente en adulto mayor. No sustituye medidas físicas (elevación, medias de compresión, caminata).',
    interacciones: 'Sin interacciones farmacológicas significativas conocidas a dosis habituales.',
    conservacion: 'Temperatura ambiente, protegido de luz.',
  },

  HESPERIDINA: {
    categoria: 'Flavonoide cítrico, venotónico y antioxidante. Habitualmente combinado con diosmina.',
    indicaciones: 'Apoyo en insuficiencia venosa crónica y fragilidad capilar. Coadyuvante en hemorroides.',
    posologia: 'Habitualmente 50–100 mg combinada con diosmina (450 mg). Seguir indicación del producto.',
    efectos_adversos: 'Bien tolerada. Molestias gástricas ocasionales.',
    contraindicaciones: 'Hipersensibilidad. Embarazo y lactancia (datos limitados).',
    precauciones_adulto_mayor: 'Bien tolerado. Complemento útil para síntomas venosos.',
    interacciones: 'Sin interacciones significativas conocidas.',
    conservacion: 'Temperatura ambiente.',
  },

  CAFEINA: {
    categoria: 'Metilxantina estimulante del sistema nervioso central. Adyuvante analgésico en combinaciones.',
    indicaciones: 'Adyuvante en analgésicos para cefalea (potencia efecto de paracetamol/AAS). Estimulante leve para somnolencia.',
    posologia: 'En combinaciones analgésicas: 30–65 mg por dosis. Como estimulante OTC: hasta 200 mg por dosis, máximo 400 mg/día en adultos sanos.',
    efectos_adversos: 'Insomnio, nerviosismo, taquicardia, palpitaciones, temblor, acidez, aumento de presión arterial. Dependencia y cefalea de rebote con uso crónico.',
    contraindicaciones: 'Arritmias, hipertensión no controlada, ansiedad severa, úlcera péptica activa, insomnio. Embarazo (limitar a <200 mg/día).',
    precauciones_adulto_mayor: 'Mayor sensibilidad a efectos cardiovasculares y al insomnio. Evitar después del mediodía. Vigilar interacción con antihipertensivos.',
    interacciones: 'Ciprofloxacino y otros inhibidores de CYP1A2 (aumentan niveles). Teofilina (toxicidad aditiva). Litio (reduce niveles). Anticonceptivos orales (prolongan vida media).',
    conservacion: 'Temperatura ambiente.',
  },

  BRIMONIDINA: {
    categoria: 'Agonista alfa-2 adrenérgico. Antiglaucomatoso de uso oftálmico tópico.',
    indicaciones: 'Reducción de la presión intraocular en glaucoma de ángulo abierto e hipertensión ocular.',
    posologia: 'Adultos: 1 gota en el ojo afectado cada 8 horas (o según indicación).',
    efectos_adversos: 'Hiperemia conjuntival, ardor, prurito ocular, visión borrosa, sequedad ocular, sabor amargo, somnolencia, hipotensión, sequedad bucal.',
    contraindicaciones: 'Hipersensibilidad. Tratamiento con IMAO. Lactantes (riesgo de depresión SNC).',
    precauciones_adulto_mayor: 'Mayor riesgo de somnolencia, mareo, hipotensión postural. Cautela en enfermedad cardiovascular severa, depresión, insuficiencia hepática o renal.',
    interacciones: 'IMAO (contraindicado). Depresores del SNC (alcohol, benzodiacepinas, opioides) — efecto aditivo. Antihipertensivos, betabloqueadores.',
    conservacion: 'Temperatura ambiente, frasco bien cerrado. Desechar 4 semanas tras apertura.',
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Normalización y lookup
// ────────────────────────────────────────────────────────────────────────────

/** Quita tildes/diacríticos y normaliza espacios. */
function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Quita tokens de dosis: "500mg", "0,5%", "100 UI", "2,5 mg/ml", "25gr", etc. */
function stripDoses(s: string): string {
  // Comma decimal: "0,5"; dot decimal: "0.5". Trailing lookahead (not \b) so units
  // ending in non-word chars like "%" funcionan ante espacio/coma/fin de string.
  return s.replace(/\b\d+(?:[.,]\d+)?\s*(?:mg\/ml|mg\/kg|mg|mcg|μg|ug|gr|g|%|ui|ml|cc|kg)(?![A-Za-z0-9])/gi, '');
}

/** Aliases de nomenclatura común en Chile → clave canónica del KB. */
const ALIASES: Record<string, string> = {
  'AC ACETILSALICILICO': 'ACIDO ACETILSALICILICO',
  'ACIDO ACETIL SALICILICO': 'ACIDO ACETILSALICILICO',
  'ASPIRINA': 'ACIDO ACETILSALICILICO',
  'AAS': 'ACIDO ACETILSALICILICO',
  'AC FOLICO': 'ACIDO FOLICO',
  'AC CLAVULANICO': 'ACIDO CLAVULANICO',
  'AC MEFENAMICO': 'AC MEFENAMICO',
  'AC TRANEXAMICO': 'AC TRANEXAMICO',
  'AC VALPROICO': 'AC VALPROICO',
  'ACIDO MEFENAMICO': 'AC MEFENAMICO',
  'ACIDO TRANEXAMICO': 'AC TRANEXAMICO',
  'ACIDO VALPROICO': 'AC VALPROICO',
  'OX ZINC': 'OXIDO DE ZINC',
  'OXIDO ZINC': 'OXIDO DE ZINC',
  'DICLOFENACO SODICO': 'DICLOFENACO',
  'DICLOFENACO POTASICO': 'DICLOFENACO',
  'DICLOFENACO DIETILAMINA': 'DICLOFENACO',
  'LOSARTAN POTASICO': 'LOSARTAN',
  'TADALAFILO': 'TADALAFILO',
  'TADALAFIL': 'TADALAFILO',
  'SILDENAFIL': 'SILDENAFIL',
  'SILDENAFILO': 'SILDENAFIL',
  'VITAMINA D': 'VITAMINA D3',
  'COLECALCIFEROL': 'VITAMINA D3',
  'VITAMINA B12': 'CIANOCOBALAMINA',
  'CIANOCOBALAMINA': 'CIANOCOBALAMINA',
  'PARGEVERINA': 'PARGEVERINA CLORHIDRATO',
  'OXOLAMINA CITRATO': 'OXOLAMINA',
  'OXIBUTININA CLORHIDRATO': 'OXIBUTININA',
  'DIFENIDOL CLORHIDRATO': 'DIFENIDOL',
  'CLONIXINATO DE LISINA': 'CLONIXINATO',
  'FLAVOXATO CLORHIDRATO': 'FLAVOXATO',
  'FUMARATO FERROSO': 'HIERRO',
  'HIERRO BISGLICINATO QUELATO': 'HIERRO',
  'AC.ACETILSALICILICO': 'ACIDO ACETILSALICILICO',
  'CIPROFLOXACINO 0': 'CIPROFLOXACINO',
  'FLUTICASONA FUROATO': 'FLUTICASONA',
  'FLUTICASONA PROPIONATO': 'FLUTICASONA',
  'PROPIONATO DE FLUTICASONA': 'FLUTICASONA',
  'FUROATO DE FLUTICASONA': 'FLUTICASONA',

  // Antiácidos / GI variantes
  'OX.ZINC': 'OXIDO DE ZINC',
  'HIDROXIDO DE ALUMINIO': 'ALUMINIO HIDROXIDO',
  'HIDROXIDO DE MAGNESIO': 'MAGNESIO HIDROXIDO',
  'CARBONATO CALCIO': 'CARBONATO DE CALCIO',
  'BICARBONATO SODIO': 'BICARBONATO DE SODIO',
  'BICARBONATO DE NA': 'BICARBONATO DE SODIO',

  // Anticonceptivos / hormonales
  'LEVONOGESTREL': 'LEVONORGESTREL',

  // Antihipertensivos / cardio
  'ACIDO IBANDRONICO': 'AC IBANDRONICO',
  'AC.IBANDRONICO': 'AC IBANDRONICO',
  'IBANDRONATO': 'AC IBANDRONICO',
  'FINASTERIDE': 'FINASTERIDA',
  'VITAMINA B1': 'TIAMINA',
  'AC.HIALURONICO': 'HIALURONATO DE SODIO',
  'ACIDO HIALURONICO': 'HIALURONATO DE SODIO',
  'AC HIALURONICO': 'HIALURONATO DE SODIO',
  'AC.SALICILICO': 'AC SALICILICO',
  'ACIDO SALICILICO': 'AC SALICILICO',
  'AC.GLICOLICO': 'AC GLICOLICO',
  'ACIDO GLICOLICO': 'AC GLICOLICO',
  'AC.LACTICO': 'AC LACTICO',
  'ACIDO LACTICO': 'AC LACTICO',
  'POLIVIDONA YODADA': 'POVIDONA YODADA',
  'POVIDONA IODADA': 'POVIDONA YODADA',
  'YODOPOVIDONA': 'POVIDONA YODADA',

  // Vitaminas / minerales
  'POTASIO GLUCONATO': 'POTASIO',
  'GLUCONATO DE POTASIO': 'POTASIO',
  'CLORURO DE POTASIO': 'POTASIO',
  'BISGLICINATO DE MAGNESIO': 'MAGNESIO',
  'CITRATO DE MAGNESIO': 'MAGNESIO',
  'OXIDO DE MAGNESIO': 'MAGNESIO',
  'CLORURO DE MAGNESIO': 'MAGNESIO',
  'SULFATO DE MAGNESIO': 'SAL INGLESA',
  'SULFATO FERROSO': 'HIERRO',
  'BISGLICINATO DE HIERRO': 'HIERRO',
  'HIERRO BISGLICINATO': 'HIERRO',
  'GLUCONATO FERROSO': 'HIERRO',
  'AC HIGADO DE BACALAO BACAL': 'AC HIGADO DE BACALAO',
  'ACEITE DE HIGADO DE BACALAO': 'AC HIGADO DE BACALAO',

  // Aceites / cuidado
  'ACE DE RICINO': 'ACEITE DE RICINO',
  'ACEITE RICINO': 'ACEITE DE RICINO',

  // Multinutrientes / lubricantes / varios
  'MINERALES': 'POLIVITAMINICO',
  'PROTEINAS': 'POLIVITAMINICO',
  'VITAMINAS': 'POLIVITAMINICO',
  'VITAMINAS B': 'POLIVITAMINICO',
  'AC GLUTAMICO': 'POLIVITAMINICO',
  'PANTOTENATO DE CALCIO': 'POLIVITAMINICO',
  'AC GRASOS': 'POLIVITAMINICO',
  'N ACETILCISTEINA': 'N-ACETILCISTEINA',
  'HIDROXIPROPILMETILCELULOSA': 'HIPROMELOSA',
  'HPMC': 'HIPROMELOSA',
  'MOMETASONA FUROATO': 'MOMETASONA',
  'FUROATO DE MOMETASONA': 'MOMETASONA',
  'CALCIFEDIOL': 'VITAMINA D3',
  'HIDROXOCOBALAMINA': 'CIANOCOBALAMINA',
  'DIMETICONA': 'SIMETICONA',
  'POLIETILENGLICOL 400': 'MACROGOL',
  'POLIETILENGLICOL': 'MACROGOL',
  'PEG 400': 'MACROGOL',
  'PEG': 'MACROGOL',
  'PROPILENGLICOL': 'GLICERINA',
  'GLYCINE MAX': 'SOJA',
  'PERSEA GRATISSIMA': 'PALTO',
  'PALTA': 'PALTO',
  'BIFOSFATO SODICO': 'FOSFATO SODIO',
  'FOSFATO SODICO': 'FOSFATO SODIO',
  'FOSFATO DISODICO': 'FOSFATO SODIO',
  'PENICILINA BENZATINA': 'PENICILINA',
  'BENZATINA': 'PENICILINA',
  'BURSA PASTORIS': 'FITO VENOTONICO',
  'CASTAÑO DE INDIAS': 'FITO VENOTONICO',
  'CASTANO DE INDIAS': 'FITO VENOTONICO',
  'PSIDIUM GUAJAVA': 'FITO ANTIDIARREICO',
  'CLOROCARVACROL': 'TOPICO RESPIRATORIO',
  'HIGADO BACALAO': 'AC HIGADO DE BACALAO',
  'LANOLINA': 'EMOLIENTE',
  'BELLADONA': 'FITO ESPASMOLITICO',
  'NUX VOMICA': 'HOMEOPATICO',
  'THUJA D': 'HOMEOPATICO',
  'THUJA D1': 'HOMEOPATICO',
  'THUJA D2': 'HOMEOPATICO',
  'THUJA D3': 'HOMEOPATICO',
  'THUJA D4': 'HOMEOPATICO',
  'THUJA D6': 'HOMEOPATICO',
  'THUJA D12': 'HOMEOPATICO',
  'THUJA D30': 'HOMEOPATICO',
  'SYMPHYTUM OFFICINALE': 'CONSUELDA',
  'SYMPHYTUM OFFICINALE I': 'CONSUELDA',
  'ALCOHOL BENCILICO': 'BENZOCAINA',
  'BISMUTO': 'SUBSALICILATO BISMUTO',
  'FENOFTALEINA': 'LAXANTE ESTIMULANTE',
  'OXIBENZONA': 'PROTECTOR SOLAR',
  'PABA': 'PROTECTOR SOLAR',
  'CMP': 'POLIVITAMINICO',
  'UTP': 'POLIVITAMINICO',
  'MIEL ABEJAS': 'MIEL',
  'CIRUELA': 'LAXANTE NATURAL',
  'HIERBAS Y MIEL': 'LAXANTE NATURAL',
  'CLAVO OLOR': 'FITO BUCAL',
  'LIMON': 'FITO BUCAL',

  // Probióticos
  'LACTOBACILLUS REUTERI': 'LACTOBACILLUS',
  'LACTOBACILLUS RHAMNOSUS': 'LACTOBACILLUS',
  'LACTOBACILLUS ACIDOPHILUS': 'LACTOBACILLUS',
  'LACTOBACILLUS CASEI': 'LACTOBACILLUS',
  'SACCHAROMYCES BOULARDII': 'SACCHAROMYCES',

  // Fitoterapia
  'CASSIA ANGUSTIFOLIA': 'HOJAS DE SEN',
  'SEN': 'HOJAS DE SEN',
  'SENNA': 'HOJAS DE SEN',
  'GINKGO BILOBA': 'GINKGO',
  'PASIONARIA': 'PASIFLORA',
  'TORONJIL': 'MELISA',
  'CHAMOMILLA': 'MANZANILLA',
  'CRATAEGUS': 'ESPINO',

  // Anticolinérgicos / urológicos
  'ESCOPOLAMINA BUTILBROMURO': 'ESCOPOLAMINA',
  'BUTILBROMURO DE ESCOPOLAMINA': 'ESCOPOLAMINA',
  'HIOSCINA': 'ESCOPOLAMINA',
  'BUTILHIOSCINA': 'ESCOPOLAMINA',
  'TROSPIO CLORURO': 'TROSPIO CLORURO',
  'CLORURO DE TROSPIO': 'TROSPIO CLORURO',

  // Antidepresivos / psicofármacos
  'BUPROPION ANFEBUTAMONA': 'BUPROPION',
  'ANFEBUTAMONA': 'BUPROPION',

  // Antifúngicos
  'CICLOPIROX OLAMINA': 'CICLOPIROXOLAMINA',
  'CICLOPIROX': 'CICLOPIROXOLAMINA',

  // Suplementos — sinónimos comunes
  'VIT C': 'VITAMINA C',
  'ACIDO ASCORBICO': 'VITAMINA C',
  'AC ASCORBICO': 'VITAMINA C',
  'VIT D': 'VITAMINA D3',
  'VITAMINA D3': 'VITAMINA D3',
  'VIT D3': 'VITAMINA D3',
  'VIT E': 'VITAMINA E',
  'TOCOFEROL': 'VITAMINA E',
  'ALFA TOCOFEROL': 'VITAMINA E',
  'VIT A': 'VITAMINA A',
  'RETINOL': 'VITAMINA A',
  'VIT B1': 'TIAMINA',
  'VIT B6': 'PIRIDOXINA',
  'VITAMINA B6': 'PIRIDOXINA',
  'VIT B12': 'CIANOCOBALAMINA',
  'METILCOBALAMINA': 'CIANOCOBALAMINA',
  'VIT B9': 'ACIDO FOLICO',
  'FOLATO': 'ACIDO FOLICO',
  'ACIDO FOLINICO': 'ACIDO FOLICO',

  // Condroprotectores
  'SULFATO DE GLUCOSAMINA': 'GLUCOSAMINA',
  'CLORHIDRATO DE GLUCOSAMINA': 'GLUCOSAMINA',
  'GLUCOSAMINA SULFATO': 'GLUCOSAMINA',
  'GLUCOSAMINA CLORHIDRATO': 'GLUCOSAMINA',
  'SULFATO DE CONDROITINA': 'CONDROITINA',
  'CONDROITINA SULFATO': 'CONDROITINA',
  'CONDROITIN SULFATO': 'CONDROITINA',

  // Venotónicos
  'DIOSMINA HESPERIDINA': 'DIOSMINA + HESPERIDINA',

};

/** Tokeniza un string de `active_ingredient` en sus componentes canónicos. */
export function tokenizeIngredients(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const cleaned = stripDoses(stripDiacritics(raw.toUpperCase()))
    .replace(/[+&/]/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = cleaned
    .split(/,|\bY\b/)
    .map((p) => p.replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 2);
  // De-dup preserving order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const canon = ALIASES[p] ?? p;
    if (!seen.has(canon)) {
      seen.add(canon);
      out.push(canon);
    }
  }
  return out;
}

export interface DrugLookupResult {
  /** Nombre canónico encontrado en KB */
  name: string;
  info: DrugInfo;
}

/**
 * Índice combo → clave canónica KB. Construido una vez al module load.
 * Permite resolver combinaciones independientemente del orden de tokens
 * en `active_ingredient` vs orden usado en la clave KB.
 *   "PARACETAMOL + TRAMADOL" y "TRAMADOL + PARACETAMOL" → misma entrada.
 */
const COMBO_INDEX: Map<string, string> = (() => {
  const idx = new Map<string, string>();
  for (const key of Object.keys(DRUG_INFO)) {
    if (key.includes(' + ')) {
      const sorted = key.split(' + ').sort().join(' + ');
      idx.set(sorted, key);
    }
  }
  return idx;
})();

/** Busca info para cada componente del principio activo. Devuelve los que existan en KB. */
export function lookupDrugInfo(activeIngredient: string | null | undefined): DrugLookupResult[] {
  const tokens = tokenizeIngredients(activeIngredient);
  if (tokens.length === 0) return [];

  // 1) Combinación completa bidireccional (sorted-match contra COMBO_INDEX)
  if (tokens.length > 1) {
    const sortedQuery = tokens.slice().sort().join(' + ');
    const canonical = COMBO_INDEX.get(sortedQuery);
    if (canonical) {
      return [{ name: canonical, info: DRUG_INFO[canonical] }];
    }
  }

  // 2) Lookup por componente individual
  const results: DrugLookupResult[] = [];
  for (const token of tokens) {
    if (DRUG_INFO[token]) {
      results.push({ name: token, info: DRUG_INFO[token] });
      continue;
    }
    // Coincidencia parcial: si la clave del KB es prefijo del token o viceversa
    const partial = Object.keys(DRUG_INFO).find(
      (k) => k.split(' + ').length === 1 && (token.startsWith(k) || k.startsWith(token))
    );
    if (partial) {
      results.push({ name: partial, info: DRUG_INFO[partial] });
    }
  }
  return results;
}

/** Nombre amigable: convierte "ACIDO ACETILSALICILICO" → "Ácido acetilsalicílico". */
export function prettifyDrugName(canonical: string): string {
  return canonical
    .toLowerCase()
    .replace(/\bacido\b/g, 'ácido')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\+/g, ' + ');
}
