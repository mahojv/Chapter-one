// Declaraciones de tipos para soporte de estilos CSS y módulos CSS en la web
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: string;
  export default content;
}
