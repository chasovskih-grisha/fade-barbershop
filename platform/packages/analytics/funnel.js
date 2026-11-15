"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversionFunnelAnalyzer = void 0;
class ConversionFunnelAnalyzer {
    static calculateFunnel(steps) {
        if (steps.length === 0)
            return [];
        const initialUsers = steps[0].users;
        return steps.map((step, index) => {
            const prevUsers = index === 0 ? step.users : steps[index - 1].users;
            const conversionRate = initialUsers > 0 ? (step.users / initialUsers) * 100 : 0;
            const stepConversionRate = prevUsers > 0 ? (step.users / prevUsers) * 100 : 0;
            const dropoffRate = 100 - stepConversionRate;
            return {
                stepName: step.stepName,
                conversionRate: parseFloat(conversionRate.toFixed(2)),
                dropoffRate: parseFloat(dropoffRate.toFixed(2)),
                totalUsers: initialUsers,
                completedUsers: step.users,
            };
        });
    }
}
exports.ConversionFunnelAnalyzer = ConversionFunnelAnalyzer;
