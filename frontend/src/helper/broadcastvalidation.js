// Broadcast conventions:
// - name: required, plain text label for this broadcast run
// - templateId: required, must reference an APPROVED template
// - group: required (audience / segment this broadcast goes to)
// - schedule: optional; if "later" mode is chosen, a future date+time is required

export const BROADCAST_STATUSES = ["draft", "scheduled", "sending", "completed", "failed"];

export function validateBroadcastName(name) {
    const trimmed = (name || "").trim();
    if (!trimmed) return "Broadcast name is required";
    if (trimmed.length > 120) return "Keep the name under 120 characters";
    return "";
}

export function validateTemplateSelection(templateId) {
    if (!templateId) return "Select an approved template to send";
    return "";
}

export function validateGroup(group) {
    const trimmed = (group || "").trim();
    if (!trimmed) return "Enter the audience / group for this broadcast";
    return "";
}

export function validateSchedule(mode, scheduledAt) {
    if (mode !== "later") return "";
    if (!scheduledAt) return "Pick a date and time to schedule this broadcast";
    const chosen = new Date(scheduledAt);
    if (Number.isNaN(chosen.getTime())) return "Enter a valid date and time";
    if (chosen.getTime() <= Date.now()) return "Scheduled time must be in the future";
    return "";
}

// delivered/read/failed as a % of sent — drives the thin progress bar under each stat card
export function computeStatPercentages(stats) {
    const sent = stats?.sent || 0;
    if (!sent) return { sent: 0, delivered: 0, read: 0, failed: 0 };
    return {
        sent: 100,
        delivered: Math.min(100, ((stats.delivered || 0) / sent) * 100),
        read: Math.min(100, ((stats.read || 0) / sent) * 100),
        failed: Math.min(100, ((stats.failed || 0) / sent) * 100),
    };
}

// Rounds the chart's max value up to a "nice" number and returns evenly spaced
// tick values (0..niceMax), similar to how chart libraries auto-scale an axis.
export function computeAxisTicks(maxValue, tickCount = 4) {
    if (!maxValue || maxValue <= 0) return [0, 1];
    const rawStep = maxValue / tickCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) ticks.push(niceStep * i);
    return ticks;
}

export function formatNumber(n) {
    return Number(n || 0).toLocaleString("en-IN");
}

export function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}