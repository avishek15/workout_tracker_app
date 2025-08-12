import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

type RequestTab = "received" | "sent";

export function FriendRequests() {
    const [activeTab, setActiveTab] = useState<RequestTab>("received");

    const receivedRequests = useQuery(api.social.getPendingFriendRequests);
    const sentRequests = useQuery(api.social.getSentFriendRequests);
    const acceptRequest = useMutation(api.social.acceptFriendRequest);
    const rejectRequest = useMutation(api.social.rejectFriendRequest);

    const handleAccept = async (requestId: Id<"friendRequests">) => {
        try {
            await acceptRequest({ requestId });
            toast.success("Friend request accepted!");
        } catch (error) {
            toast.error(
                "Failed to accept request: " + (error as Error).message
            );
        }
    };

    const handleReject = async (requestId: Id<"friendRequests">) => {
        try {
            await rejectRequest({ requestId });
            toast.success("Friend request rejected");
        } catch (error) {
            toast.error(
                "Failed to reject request: " + (error as Error).message
            );
        }
    };

    const tabs = [
        { id: "received" as const, label: "Received" },
        { id: "sent" as const, label: "Sent" },
    ];

    if (receivedRequests === undefined || sentRequests === undefined) {
        return (
            <div className="text-center text-text-secondary">Loading...</div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">
                Friend Requests
            </h2>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-background-primary rounded-lg p-1 shadow-sm border border-accent-primary/20">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md font-medium transition-colors font-source-sans text-sm sm:text-base ${
                            activeTab === tab.id
                                ? "bg-accent-primary text-white shadow-sm"
                                : "text-text-secondary hover:text-text-primary hover:bg-background-secondary"
                        }`}
                    >
                        <span className="truncate">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Received Requests */}
            {activeTab === "received" && (
                <div>
                    {receivedRequests.length === 0 ? (
                        <div className="text-center text-text-secondary py-8">
                            <p>No pending friend requests</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {receivedRequests.map((request) => (
                                <div
                                    key={request._id}
                                    className="bg-background-primary rounded-lg p-4 border border-accent-primary/20"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-text-primary">
                                                {request.fromUserName ||
                                                    "Unknown User"}
                                            </h3>
                                            <p className="text-sm text-text-secondary">
                                                {request.fromUserEmail}
                                            </p>
                                            <p className="text-xs text-text-secondary">
                                                Sent{" "}
                                                {new Date(
                                                    request.createdAt
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    void handleAccept(
                                                        request._id
                                                    );
                                                }}
                                                className="px-3 py-1 bg-accent-primary text-white rounded text-sm hover:bg-accent-primary/90 transition-colors"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => {
                                                    void handleReject(
                                                        request._id
                                                    );
                                                }}
                                                className="px-3 py-1 bg-danger text-white rounded text-sm hover:bg-danger-hover transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Sent Requests */}
            {activeTab === "sent" && (
                <div>
                    {sentRequests.length === 0 ? (
                        <div className="text-center text-text-secondary py-8">
                            <p>No sent friend requests</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sentRequests.map((request) => (
                                <div
                                    key={request._id}
                                    className="bg-background-primary rounded-lg p-4 border border-accent-primary/20"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-text-primary">
                                                {request.toUserName ||
                                                    "Unknown User"}
                                            </h3>
                                            <p className="text-sm text-text-secondary">
                                                {request.toUserEmail}
                                            </p>
                                            <p className="text-xs text-text-secondary">
                                                Sent{" "}
                                                {new Date(
                                                    request.createdAt
                                                ).toLocaleDateString()}
                                            </p>
                                            <span
                                                className={`inline-block px-2 py-1 text-xs rounded ${
                                                    request.status === "pending"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : request.status ===
                                                            "accepted"
                                                          ? "bg-green-100 text-green-800"
                                                          : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {request.status
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    request.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
