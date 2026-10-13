export function useRouter() {
  return {
    push(path: string) {
      window.location.assign(path);
    },
    replace(path: string) {
      window.location.replace(path);
    },
    refresh() {
      window.location.reload();
    },
  };
}
