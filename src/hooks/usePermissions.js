import { useAuth } from '../context/AuthContext';
import { hasPermission, canPerformAction, getAllowedActions, isOwner } from '../config/permissions';

/**
 * Хук для проверки прав доступа
 * Использование:
 * const { can, canOwn, allowed } = usePermissions();
 * if (can('clients', 'create')) { ... }
 * if (canOwn('schedule', 'edit', training)) { ... }
 */
export const usePermissions = () => {
    const { user } = useAuth();
    const role = user?.role?.toLowerCase();

    /**
     * Проверка простого права
     */
    const can = (module, action) => {
        return hasPermission(role, module, action);
    };

    /**
     * Проверка права с учётом владения ресурсом
     */
    const canOwn = (module, action, resource = null, ownerField = 'trainer') => {
        return canPerformAction(user, module, action, resource, ownerField);
    };

    /**
     * Получить список разрешённых действий
     */
    const allowed = (module) => {
        return getAllowedActions(role, module);
    };

    /**
     * Проверка владения ресурсом
     */
    const owns = (resource, ownerField = 'trainer') => {
        return isOwner(user, resource, ownerField);
    };

    /**
     * Проверка роли
     */
    const isRole = (checkRole) => {
        return role === checkRole.toLowerCase();
    };

    /**
     * Проверка, является ли админом
     */
    const isAdmin = role === 'admin';

    /**
     * Проверка, является ли менеджером
     */
    const isManager = role === 'manager';

    /**
     * Проверка, является ли тренером
     */
    const isTrainer = role === 'trainer';

    return {
        can,
        canOwn,
        allowed,
        owns,
        isRole,
        isAdmin,
        isManager,
        isTrainer,
        role,
        user,
    };
};

export default usePermissions;