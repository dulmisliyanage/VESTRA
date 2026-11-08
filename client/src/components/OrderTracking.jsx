
const STATUS_STEPS = [
    "pending",
    "processing",
    "shipped",
    "delivered"
];

const STATUS_LABELS = {
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered"
};

export default function OrderTracking({
    status = "pending"
}) {
    const currentIndex = STATUS_STEPS.indexOf(status);

    if (status === "cancelled") {
        return (
            <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                This order has been cancelled.
            </div>
        );
    }

    if (currentIndex === -1) {
        return (
            <p className="mt-4 text-sm text-neutral-500">
                Tracking information is currently unavailable.
            </p>
        );
    }

    return (
        <div
            className="mt-6 w-full"
            aria-label={`Fulfillment status: ${STATUS_LABELS[status]}`}
        >
            <div className="flex w-full items-start">
                {STATUS_STEPS.map((step, index) => {
                    const completed = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                        <div
                            key={step}
                            className="flex min-w-0 flex-1 items-start"
                        >
                            <div className="flex min-w-0 flex-1 flex-col items-center">
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs ${completed
                                            ? "border-[#242120] bg-[#242120] text-white"
                                            : "border-neutral-300 bg-white text-neutral-400"
                                        }`}
                                    aria-current={
                                        isCurrent ? "step" : undefined
                                    }
                                >
                                    {completed ? "✓" : index + 1}
                                </div>

                                <span
                                    className={`mt-3 text-center text-[11px] sm:text-xs ${completed
                                            ? "text-[#191919]"
                                            : "text-neutral-400"
                                        } ${isCurrent ? "font-semibold" : ""
                                        }`}
                                >
                                    {STATUS_LABELS[step]}
                                </span>
                            </div>

                            {index < STATUS_STEPS.length - 1 && (
                                <div
                                    className={`mt-[17px] h-px w-3 shrink-0 sm:w-6 ${index < currentIndex
                                            ? "bg-[#242120]"
                                            : "bg-neutral-300"
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <p
                className="mt-5 text-center text-xs text-neutral-500"
                role="status"
            >
                Current status: {STATUS_LABELS[status]}
            </p>
        </div>
    );
}
