import api from "./api";

export interface NavItem {
  _id: string;
  label: string;
  url: string;
  icon?: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
  openInNewTab: boolean;
  parent: string | null;
  location: "header" | "footer" | "sidebar";
  visibleTo: "all" | "guest" | "user";
  children?: NavItem[];
}

/**
 * Fetch nav items from user_backend public API.
 * user_backend must expose: GET /nav?location=header
 */
export const getNavItems = async (
  location: "header" | "footer" | "sidebar" = "header",
  isAuthenticated = false
): Promise<NavItem[]> => {
  try {
    const res = await api.get(`/nav?location=${location}`);
    const items: NavItem[] = res.data?.data || [];

    // Filter by visibleTo — "all" shows to everyone, "guest" only to guests, "user" only to logged-in
    const filtered = items.filter((item) => {
      if (item.visibleTo === "all") return true;
      if (item.visibleTo === "user" && isAuthenticated) return true;
      if (item.visibleTo === "guest" && !isAuthenticated) return true;
      return false;
    });

    // Build tree structure (parent/children)
    const roots: NavItem[] = [];
    const map: Record<string, NavItem> = {};
    filtered.forEach((item) => (map[item._id] = { ...item, children: [] }));

    filtered.forEach((item) => {
      if (item.parent && map[item.parent]) {
        map[item.parent].children!.push(map[item._id]);
      } else {
        roots.push(map[item._id]);
      }
    });

    return roots.sort((a, b) => a.order - b.order);
  } catch {
    // Graceful fallback — return empty, header will use category-based nav
    return [];
  }
};
