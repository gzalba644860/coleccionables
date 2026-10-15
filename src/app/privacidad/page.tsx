import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto grid max-w-2xl gap-4 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Política de privacidad</h1>
      <p>
        Coleccionables es un portal para comprar, vender e intercambiar figuritas y cartas entre
        coleccionistas. Esta página explica qué datos guardamos y para qué.
      </p>
      <h2 className="text-lg font-semibold">Qué datos guardamos</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Tu email, nombre o apodo, ciudad o barrio y el texto “Sobre mí”, si lo completás.</li>
        <li>Tu foto de perfil, si subís una o si entrás con Google (usamos la foto de tu cuenta).</li>
        <li>Tu contraseña, guardada cifrada, si te registrás con email.</li>
        <li>Los medios de contacto que agregues, tu colección (lo que ofrecés y buscás) y tus mensajes.</li>
      </ul>
      <h2 className="text-lg font-semibold">Entrar con Google</h2>
      <p>
        Si entrás con Google, solo recibimos tu nombre, tu email y tu foto de perfil. No accedemos
        a tus correos, contactos, archivos ni ningún otro dato de tu cuenta de Google.
      </p>
      <h2 className="text-lg font-semibold">Para qué los usamos</h2>
      <p>
        Solo para que funcione el portal: identificarte, mostrar tu perfil y tu colección, y que
        otros usuarios registrados puedan contactarte. Los medios de contacto solo los ven usuarios
        registrados y aprobados. No vendemos ni compartimos tus datos con terceros ni los usamos
        para publicidad.
      </p>
      <h2 className="text-lg font-semibold">Borrar tus datos</h2>
      <p>
        Podés cambiar o borrar tus datos desde “Mis datos”. Si querés eliminar tu cuenta por
        completo, pedíselo a un administrador por Mensajes y la borramos con todo su contenido.
      </p>
    </article>
  );
}
