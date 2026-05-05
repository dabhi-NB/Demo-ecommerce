export function isAdmin(){
    const userRole = (global as any).user_role;
    return userRole === '0' || userRole === '1';
}

export function isSuperAdmin(){
    const userRole = (global as any).user_role;
    return userRole === '0';
}

export function isUser(){
    const userRole = (global as any).user_role;
    return userRole === '2';
}