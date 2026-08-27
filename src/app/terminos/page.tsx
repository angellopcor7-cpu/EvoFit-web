import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../legal.module.css";

export default function TerminosPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Volver
        </Link>

        <h1 className={styles.title}>Términos y condiciones de EvoFit</h1>
        <p className={styles.updated}>Última actualización: agosto de 2026</p>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Qué es EvoFit</h2>
          <p className={styles.paragraph}>
            EvoFit es una aplicación de entrenamiento y nutrición que te
            ayuda a organizar tus rutinas, tu dieta y a llevar seguimiento
            de tu progreso físico. EvoFit es una herramienta de apoyo: no
            reemplaza el consejo de un médico, nutriólogo o entrenador
            certificado.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Tu cuenta</h2>
          <ul className={styles.list}>
            <li>Debes dar información real al crear tu cuenta.</li>
            <li>Eres responsable de mantener segura tu contraseña.</li>
            <li>
              Debes tener al menos 13 años para usar EvoFit (o la edad
              mínima que exija la ley en tu país).
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Uso responsable</h2>
          <p className={styles.paragraph}>
            Las rutinas, planes de alimentación y cálculos de macros que
            ofrece EvoFit son generales y no están personalizados por un
            profesional de la salud. Consulta a tu médico antes de empezar
            un programa de ejercicio o cambio de dieta, especialmente si
            tienes alguna condición médica.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Contenido que subes</h2>
          <p className={styles.paragraph}>
            Las fotos de evolución física, datos corporales y cualquier
            otra información que subas siguen siendo tuyas. EvoFit las usa
            únicamente para mostrártelas a ti dentro de la app, como se
            describe en la Política de Privacidad.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Disponibilidad del servicio</h2>
          <p className={styles.paragraph}>
            Hacemos lo posible por mantener EvoFit disponible, pero puede
            haber interrupciones por mantenimiento o fallas técnicas. No
            garantizamos que el servicio esté libre de errores en todo
            momento.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Cambios a estos términos</h2>
          <p className={styles.paragraph}>
            Podemos actualizar estos términos conforme la app crece. Si hay
            cambios importantes, te avisaremos dentro de la app.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Contacto</h2>
          <p className={styles.paragraph}>
            Si tienes dudas sobre estos términos, puedes contactarnos desde
            la sección de perfil dentro de la app.
          </p>
        </div>
      </div>
    </div>
  );
}
