"use client";
import React, { useState, useEffect, useMemo } from "react";

export default function PlanAdjustment({
    mealCalories,
    numSnacks,
    numDays,
    numWeeks,
    oldPlan, // { mealCalories, numSnacks, numDays, numWeeks }
    lookupTable,
    promoType,
    promoValue,
    promoScope,
}) {
    const maxMeals = 5;

    // === STATES ===
    const [daysConsumed, setDaysConsumed] = useState(0);

    // Initialize new meals (all 5 slots)
    const [newMeals, setNewMeals] = useState([]);
    const [newSnacks, setNewSnacks] = useState(numSnacks);
    const [newDays, setNewDays] = useState(numDays);
    const [newWeeks, setNewWeeks] = useState(numWeeks);

    useEffect(() => {
        const mealsArr = [...mealCalories];
        while (mealsArr.length < maxMeals) mealsArr.push(0);
        setNewMeals(mealsArr);
    }, [mealCalories]);

    const handleMealChange = (idx, kcal) => {
        const updated = [...newMeals];
        updated[idx] = kcal;
        setNewMeals(updated);
    };

    // === REMAINING LOGIC ===
    const remainingValues = useMemo(() => {
        const totalPlanDays = numDays * numWeeks;
        const remainingDays = Math.max(totalPlanDays - daysConsumed, 0);

        const usedMealsCount = mealCalories.filter((c) => c > 0).length;
        const remainingMealsCount = maxMeals - usedMealsCount;

        const remainingSnacks = newSnacks - numSnacks;
        const remainingWeeks = newWeeks - numWeeks;

        return { remainingDays, remainingMealsCount, remainingSnacks, remainingWeeks };
    }, [daysConsumed, newSnacks, newWeeks, oldPlan]);

    // === COST CALCULATION ===
    const calcDailyMealCost = (mealsArr) =>
        mealsArr.reduce((sum, kcal, idx) => {
            if (!kcal) return sum;
            const base = lookupTable.mealPrices[kcal] || 0;
            const disc = lookupTable.mealDiscounts[idx] || 0;
            return sum + base * (1 - disc / 100);
        }, 0);

    const calcDailySnackCost = (snacks) => {
        const base = lookupTable.mealPrices[200];
        let total = 0;
        for (let i = 1; i <= snacks; i++) {
            const disc = lookupTable.snackDiscounts[i] || 0;
            total += base * (1 - disc / 100);
        }
        return total;
    };

    const adjustment = useMemo(() => {
        const remainingDays = remainingValues.remainingDays;

        const oldDailyMeals = calcDailyMealCost(mealCalories);
        const oldDailySnacks = calcDailySnackCost(numSnacks);
        const oldDailyTotal = oldDailyMeals + oldDailySnacks;

        const newDailyMeals = calcDailyMealCost(newMeals);
        const newDailySnacks = calcDailySnackCost(newSnacks);
        const newDailyTotal = newDailyMeals + newDailySnacks;

        const dailyDifference = newDailyTotal - oldDailyTotal;

        const subtotalAdjustment = dailyDifference * remainingDays;

        let promoAdjustment = 0;
        if (promoValue > 0 && subtotalAdjustment !== 0) {
            let base = Math.abs(subtotalAdjustment);
            if (promoScope === "meals")
                base = Math.abs(newDailyMeals - oldDailyMeals) * remainingDays;
            else if (promoScope === "snacks")
                base = Math.abs(newDailySnacks - oldDailySnacks) * remainingDays;

            promoAdjustment =
                promoType === "percentage" ? (base * promoValue) / 100 : Math.min(promoValue, base);
        }

        const netAdjustment =
            subtotalAdjustment > 0 ? subtotalAdjustment - promoAdjustment : subtotalAdjustment + promoAdjustment;

        const finalStatus =
            netAdjustment > 0
                ? `TOP-UP REQUIRED: PAY ${netAdjustment.toFixed(2)} AED`
                : netAdjustment < 0
                    ? `TOP-DOWN: ${Math.abs(netAdjustment).toFixed(2)} AED WILL BE CREDITED`
                    : "NO PRICE CHANGE";

        return { ...remainingValues, dailyDifference, subtotalAdjustment, promoAdjustment, netAdjustment, finalStatus };
    }, [newMeals, newSnacks, newDays, newWeeks, daysConsumed, oldPlan, lookupTable, promoType, promoValue, promoScope, remainingValues]);

    function calculateAdjustment(
        oldMeals,
        newMeals,
        oldSnacks,
        newSnacks,
        lookupTable,
        promoType,
        promoValue,
        promoScope,
    ) {
        // === MEALS ADJUSTMENT ===
        let mealsAdjustment = 0;
        oldMeals.forEach((oldKcal, idx) => {
            const newKcal = newMeals[idx] || 0;
            if (newKcal !== oldKcal) {
                const oldPrice = oldKcal ? (lookupTable.mealPrices[oldKcal] || 0) * (1 - (lookupTable.mealDiscounts[idx] || 0) / 100) : 0;
                const newPrice = newKcal ? (lookupTable.mealPrices[newKcal] || 0) * (1 - (lookupTable.mealDiscounts[idx] || 0) / 100) : 0;
                mealsAdjustment += newPrice - oldPrice; // positive = top-up, negative = top-down
            }
        });

        // === SNACKS ADJUSTMENT ===
        let snacksAdjustment = 0;
        const maxOldSnack = oldSnacks;
        const maxNewSnack = newSnacks;

        // iterate over snack numbers (1-based)
        for (let i = 1; i <= Math.max(maxOldSnack, maxNewSnack); i++) {
            const oldPrice = i <= oldSnacks ? (lookupTable.mealPrices[200] || 0) * (1 - (lookupTable.snackDiscounts[i] || 0) / 100) : 0;
            const newPrice = i <= newSnacks ? (lookupTable.mealPrices[200] || 0) * (1 - (lookupTable.snackDiscounts[i] || 0) / 100) : 0;
            snacksAdjustment += newPrice - oldPrice;
        }

        // === PROMO ADJUSTMENT ===
        let promoAdjustment = 0;
        if (promoValue > 0) {
            if (promoScope === "meals") {
                const base = Math.abs(mealsAdjustment);
                promoAdjustment = promoType === "percentage" ? (base * promoValue) / 100 : Math.min(base, promoValue);
            } else if (promoScope === "snacks") {
                const base = Math.abs(snacksAdjustment);
                promoAdjustment = promoType === "percentage" ? (base * promoValue) / 100 : Math.min(base, promoValue);
            } else {
                const base = Math.abs(mealsAdjustment + snacksAdjustment);
                promoAdjustment = promoType === "percentage" ? (base * promoValue) / 100 : Math.min(base, promoValue);
            }
        }

        // === NET ADJUSTMENT ===
        const netAdjustment = mealsAdjustment + snacksAdjustment - promoAdjustment;

        return {
            mealsAdjustment,
            snacksAdjustment,
            promoAdjustment,
            netAdjustment,
            finalStatus:
                netAdjustment > 0
                    ? `TOP-UP REQUIRED: PAY ${netAdjustment.toFixed(2)} AED`
                    : netAdjustment < 0
                        ? `TOP-DOWN: ${Math.abs(netAdjustment).toFixed(2)} AED WILL BE CREDITED`
                        : "NO PRICE CHANGE",
        };
    }
    console.log("mealCalories",mealCalories)
    const adjustment2 = calculateAdjustment(
        mealCalories ,
        newMeals,
        numSnacks,
        newSnacks,
        lookupTable,
        promoType,
        promoValue,
        promoScope,
    );

    console.log(adjustment2);
    return (
        <div className="col-span-2 md:col-span-1 bg-white p-6 rounded  shadow border-t-4 border-indigo-600 ">
            <h2 className="font-bold text-lg mb-4">Plan Adjustment</h2>

            {/* === OLD PLAN DISPLAY === */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                    <label className="font-bold">Old Meals</label>
                    <div>{mealCalories.join(", ") || "None"}</div>
                </div>
                <div>
                    <label className="font-bold">Old Snacks</label>
                    <div>{numSnacks}</div>
                </div>
                <div>
                    <label className="font-bold">Old Days</label>
                    <div>{numDays}</div>
                </div>
                <div>
                    <label className="font-bold">Old Weeks</label>
                    <div>{numWeeks}</div>
                </div>
            </div>

            {/* === NEW PLAN INPUTS === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                    <label className="font-bold">Days Consumed</label>
                    <input
                        type="number"
                        value={daysConsumed}
                        onChange={(e) => setDaysConsumed(Number(e.target.value))}
                        className="border p-2 rounded w-full"
                    />
                </div>
                <div>
                    <label className="font-bold">New Snacks</label>
                    <input
                        type="number"
                        value={newSnacks}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val >= 0 && val <= 5) {
                                setNewSnacks(val);
                            }
                        }}
                        className="border p-2 rounded w-full"
                    />

                </div>
                <div>
                    <label className="font-bold">New Days</label>
                    <select
                        value={newDays}
                        onChange={(e) => setNewDays(Number(e.target.value))}
                        className="border p-2 rounded w-full">
                        {[5, 6, 7].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label className="font-bold">New Weeks</label>
                    <select
                        value={newWeeks}
                        onChange={(e) => setNewWeeks(Number(e.target.value))}
                        className="border p-2 rounded w-full">
                        {[1, 2, 4].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* === MEALS SELECTION === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                {newMeals.map((kcal, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <span className="w-20">Meal {idx + 1}</span>
                        <select
                            value={kcal}
                            onChange={(e) => handleMealChange(idx, Number(e.target.value))}
                            className="border p-2 rounded flex-1"
                        >
                            <option value={0}>0 (None)</option>
                            {[400, 500, 600, 700, 800].map((k) => (
                                <option key={k} value={k}>
                                    {k} kcal
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>

            {/* === REMAINING VALUES === */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                    <label className="font-bold">Remaining Days</label>
                    <div>{adjustment.remainingDays}</div>
                </div>
                {/* <div>
                    <label className="font-bold">Remaining Meals</label>
                    <div>{adjustment.remainingMealsCount}</div>
                </div>
                <div>
                    <label className="font-bold">Remaining Snacks</label>
                    <div>{adjustment.remainingSnacks}</div>
                </div>
                <div>
                    <label className="font-bold">Remaining Weeks</label>
                    <div>{adjustment.remainingWeeks}</div>
                </div> */}
            </div>

            {/* === RESULTS === */}
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Daily Difference</span>
                    <b>{adjustment.dailyDifference.toFixed(2)} AED</b>
                </div>
                <div className="flex justify-between">
                    <span>Subtotal Adjustment</span>
                    <b>{adjustment.subtotalAdjustment.toFixed(2)} AED</b>
                </div>
                <div className="flex justify-between text-red-500">
                    <span>Promo Adjustment</span>
                    <b>-{adjustment.promoAdjustment.toFixed(2)} AED</b>
                </div>
                <div className="mt-4 p-4 bg-slate-900 text-white rounded font-bold">
                    {adjustment.finalStatus}
                </div>
            </div>
        </div>
    );
}
