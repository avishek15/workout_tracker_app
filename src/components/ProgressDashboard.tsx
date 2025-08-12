import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { formatKgForUser } from "../lib/unitConversion";

type TimeRange = "week" | "month" | "year" | "all";

export function ProgressDashboard() {
    const [timeRange, setTimeRange] = useState<TimeRange>("month");
    const [selectedExercise, setSelectedExercise] = useState<string>("");

    const exercises = useQuery(api.analytics.getExerciseList);
    const weightProgress = useQuery(api.analytics.getWeightProgress, {
        exerciseName:
            selectedExercise ||
            (exercises && exercises.length > 0 ? exercises[0] : ""),
        timeRange,
    });
    const volumeProgress = useQuery(api.analytics.getVolumeProgress, {
        exerciseName:
            selectedExercise ||
            (exercises && exercises.length > 0 ? exercises[0] : ""),
        timeRange,
    });
    const workoutFrequency = useQuery(api.analytics.getWorkoutFrequency, {
        timeRange,
    });
    const totalVolume = useQuery(api.analytics.getTotalVolume, {
        timeRange,
    });
    const completionRates = useQuery(api.analytics.getCompletionRates, {
        timeRange,
    });

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const formatChartData = (data: any[], dateField: string = "date") => {
        return (
            data?.map((item) => ({
                ...item,
                [dateField]: formatDate(item[dateField]),
            })) || []
        );
    };

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

    if (exercises === undefined) {
        return <div className="text-center py-8">Loading analytics...</div>;
    }

    return (
        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            {/* Header with Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Progress Analytics
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                    <select
                        value={timeRange}
                        onChange={(e) =>
                            setTimeRange(e.target.value as TimeRange)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                    >
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="year">Last Year</option>
                        <option value="all">All Time</option>
                    </select>
                    <select
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                    >
                        <option value="">All Exercises</option>
                        {exercises.map((exercise) => (
                            <option key={exercise} value={exercise}>
                                {exercise.charAt(0).toUpperCase() +
                                    exercise.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white p-3 sm:p-4 rounded-lg border shadow-sm">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                        Total Workouts
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {workoutFrequency?.reduce(
                            (sum, item) => sum + item.count,
                            0
                        ) || 0}
                    </p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg border shadow-sm">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                        Avg Completion Rate
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {completionRates && completionRates.length > 0
                            ? Math.round(
                                  completionRates.reduce(
                                      (sum, item) => sum + item.completionRate,
                                      0
                                  ) / completionRates.length
                              )
                            : 0}
                        %
                    </p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg border shadow-sm">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                        Total Volume
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {totalVolume
                            ?.reduce((sum, item) => sum + item.volume, 0)
                            .toLocaleString() || 0}
                    </p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg border shadow-sm">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                        Exercises Tracked
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {exercises?.length || 0}
                    </p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Weight Progress Chart */}
                {selectedExercise && (
                    <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                            Weight Progress - {selectedExercise}
                        </h3>
                        <ResponsiveContainer
                            width="100%"
                            height={250}
                            className="sm:h-[300px]"
                        >
                            <LineChart
                                data={formatChartData(weightProgress || [])}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#0088FE"
                                    strokeWidth={2}
                                    dot={{
                                        fill: "#0088FE",
                                        strokeWidth: 2,
                                        r: 4,
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Volume Progress Chart */}
                {selectedExercise && (
                    <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                            Volume Progress - {selectedExercise}
                        </h3>
                        <ResponsiveContainer
                            width="100%"
                            height={250}
                            className="sm:h-[300px]"
                        >
                            <LineChart
                                data={formatChartData(volumeProgress || [])}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="volume"
                                    stroke="#00C49F"
                                    strokeWidth={2}
                                    dot={{
                                        fill: "#00C49F",
                                        strokeWidth: 2,
                                        r: 4,
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Workout Frequency Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                        Workout Frequency
                    </h3>
                    <ResponsiveContainer
                        width="100%"
                        height={250}
                        className="sm:h-[300px]"
                    >
                        <BarChart data={workoutFrequency || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#FFBB28" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Total Volume Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                        Total Volume per Workout
                    </h3>
                    <ResponsiveContainer
                        width="100%"
                        height={250}
                        className="sm:h-[300px]"
                    >
                        <LineChart data={formatChartData(totalVolume || [])}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="volume"
                                stroke="#FF8042"
                                strokeWidth={2}
                                dot={{ fill: "#FF8042", strokeWidth: 2, r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Completion Rate Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                        Completion Rate
                    </h3>
                    <ResponsiveContainer
                        width="100%"
                        height={250}
                        className="sm:h-[300px]"
                    >
                        <LineChart
                            data={formatChartData(completionRates || [])}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="completionRate"
                                stroke="#8884D8"
                                strokeWidth={2}
                                dot={{ fill: "#8884D8", strokeWidth: 2, r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Exercise Distribution */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                        Exercise Distribution
                    </h3>
                    <ResponsiveContainer
                        width="100%"
                        height={250}
                        className="sm:h-[300px]"
                    >
                        <PieChart>
                            <Pie
                                data={
                                    exercises?.map((exercise, index) => ({
                                        name: exercise,
                                        value: 1,
                                    })) || []
                                }
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name }) => name}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {exercises?.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Data Summary */}
            <div className="bg-white p-4 sm:p-8 rounded-lg border shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                    Data Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-sm">
                    {selectedExercise && (
                        <div>
                            <h4 className="font-medium text-gray-700">
                                Weight Progress - {selectedExercise}
                            </h4>
                            <p className="text-gray-600">
                                {weightProgress && weightProgress.length > 0
                                    ? `Latest: ${formatKgForUser(weightProgress[weightProgress.length - 1]?.weight || 0)}`
                                    : "No data available"}
                            </p>
                        </div>
                    )}
                    {selectedExercise && (
                        <div>
                            <h4 className="font-medium text-gray-700">
                                Volume Progress - {selectedExercise}
                            </h4>
                            <p className="text-gray-600">
                                {volumeProgress && volumeProgress.length > 0
                                    ? `Latest: ${formatKgForUser(volumeProgress[volumeProgress.length - 1]?.volume || 0)}`
                                    : "No data available"}
                            </p>
                        </div>
                    )}
                    <div>
                        <h4 className="font-medium text-gray-700">
                            Workout Frequency
                        </h4>
                        <p className="text-gray-600">
                            {workoutFrequency && workoutFrequency.length > 0
                                ? `Average: ${Math.round(
                                      workoutFrequency.reduce(
                                          (sum, item) => sum + item.count,
                                          0
                                      ) / workoutFrequency.length
                                  )} per period`
                                : "No data available"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
