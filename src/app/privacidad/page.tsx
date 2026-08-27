import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../legal.module.css";

export default function PrivacidadPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Volver
        </Link>

        <h1 className={styles.title}>Política de Privacidad</h1>
        <p className={styles.updated}>Última actualización: agosto de 2026</p>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Qué información recopilamos</h2>
          <ul className={styles.list}>
            <li>Datos de tu cuenta: nombre, correo y contraseña.</li>
            <li>
              Datos corporales que tú decides compartir: peso, estatura,
              edad, sexo, tipo de cuerpo y alergias.
            </li>
            <li>
              Actividad dentro de la app: rutinas y entrenamientos
              completados, plan de dieta, metas y rachas.
            </li>
            <li>
              Fotos de evolución física, si decides subirlas — son
              completamente opcionales.
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Tus fotos de evolución física</h2>
          <p className={styles.paragraph}>
            Tus fotos de evolución física son privadas. Se guardan en un
            espacio de almacenamiento privado (no público) y solo tú puedes
            verlas dentro de tu cuenta, mediante enlaces temporales que
            caducan automáticamente. Nadie más — ni otros usuarios ni el
            equipo de EvoFit — tiene acceso a ellas en el uso normal de la
            app. Si activas el bloqueo biométrico, se pedirá tu huella,
            rostro o el PIN de tu dispositivo antes de mostrarlas, incluso
            si alguien más tiene tu celular desbloqueado.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Para qué usamos tu información</h2>
          <ul className={styles.list}>
            <li>Mostrarte tus rutinas, tu progreso y tu plan de dieta.</li>
            <li>Calcular tus macros y calorías recomendadas.</li>
            <li>Filtrar el menú según tus alergias declaradas.</li>
            <li>
              Enviarte notificaciones que tú actives (recordatorios de
              entreno o de dieta).
            </li>
          </ul>
          <p className={styles.paragraph}>
            No vendemos tu información a terceros ni la usamos para
            publicidad.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Dónde se guarda tu información</h2>
          <p className={styles.paragraph}>
            Tus datos se guardan en Supabase, un proveedor de base de datos
            e infraestructura con controles de acceso por cuenta (cada
            usuario solo puede leer y modificar su propia información).
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Control sobre tu información</h2>
          <ul className={styles.list}>
            <li>
              Puedes editar o borrar tus datos corporales en cualquier
              momento desde tu perfil.
            </li>
            <li>
              Puedes borrar solo tus fotos de evolución física desde
              Editar perfil → Seguridad.
            </li>
            <li>
              Puedes borrar absolutamente todo tu contenido dentro de
              EvoFit con el botón "Reiniciar TODO por completo" en tu
              perfil — esta acción es permanente.
            </li>
            <li>
              Si quieres eliminar tu cuenta por completo (incluyendo tu
              acceso), contáctanos desde la app.
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Menores de edad</h2>
          <p className={styles.paragraph}>
            EvoFit no está dirigida a menores de 13 años. Si crees que un
            menor de 13 años nos compartió información, contáctanos para
            eliminarla.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Cambios a esta política</h2>
          <p className={styles.paragraph}>
            Podemos actualizar esta política conforme agreguemos funciones
            nuevas. Si hay cambios importantes sobre cómo usamos tu
            información, te avisaremos dentro de la app.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Contacto</h2>
          <p className={styles.paragraph}>
            Si tienes dudas sobre tu privacidad o quieres ejercer alguno de
            tus derechos sobre tus datos, puedes contactarnos desde la
            sección de perfil dentro de la app.
          </p>
        </div>
      </div>
    </div>
  );
}
