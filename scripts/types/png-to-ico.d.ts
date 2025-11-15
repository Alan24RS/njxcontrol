declare module 'png-to-ico' {
  const toIco: (files: string[]) => Promise<Buffer>
  export default toIco
}
