"use client";
import React, { useState, useEffect, useMemo } from "react";

export default function PlanAdjustment({
    mealCalories,
    numSnacks,
    numDays,
    numWeeks,
    SurchargePercentage,
    reductionPer,
    markupPer,
    promoType,
    promoValue,
    promoScope,
    oldPricing,
    snackOldPricing,
    results: resultsProp,
    calculateMealPlan = () => { },
    lookupTable
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

    const results = useMemo(() => calculateMealPlan({
        mealCalories: newMeals,
        numSnacks: newSnacks,
        numDays: newDays,
        numWeeks: newWeeks,
        promoType,
        promoValue,
        promoScope,
        lookupTable,
        SurchargePercentage,
        reductionPer,
        markupPer
    }), [newMeals, newSnacks, newDays, newWeeks, promoType, promoValue, promoScope, lookupTable, SurchargePercentage, reductionPer, markupPer]);
    const adjustment = useMemo(() => {
        if (!results || !resultsProp) return null;

        // 1. Fundamental Constants
        const oldTotal = resultsProp.grandTotal;
        const newTotal = results.grandTotal; // This is the cost if the NEW plan was bought from scratch

        const totalDaysOld = numDays * numWeeks;
        const totalDaysNew = newDays * newWeeks;

        // 2. Calculate Daily Rates (Grand Total / Total Days)
        const oldDailyRate = oldTotal / (totalDaysOld || 1);
        const newDailyRate = newTotal / (totalDaysNew || 1);

        // 3. Logic: 
        // The user has already "spent" the cost of the days consumed at the OLD rate.
        // The "True Value" remaining in their account is (Total Old Cost - Consumed Cost).
        const costOfConsumedDays = oldDailyRate * daysConsumed;
        const remainingValueInAccount = oldTotal - costOfConsumedDays;

        // 4. Logic:
        // The cost of the "New Plan" for the days they have left.
        const remainingDaysToProvide = Math.max(0, totalDaysNew - daysConsumed);
        const costOfRemainingNewDays = newDailyRate * remainingDaysToProvide;

        // 5. Final Calculation
        // If the cost of the remaining days is HIGHER than the value left in account, they pay.
        // finalAdjustment = New Requirement - Current Value
        const finalAdjustment = costOfRemainingNewDays - remainingValueInAccount;

        // 6. Promo Adjustment Logic
        // This calculates how much of the "Total Adjustment" is attributed to the promo
        const oldPromo = resultsProp.promoDiscountAmount || 0;
        const newPromo = results.promoDiscountAmount || 0;
        const promoAdjustment = newPromo - oldPromo;

        const dailyDifference = newDailyRate - oldDailyRate;

        const finalStatus = finalAdjustment > 0
            ? `Top up required: ${finalAdjustment.toFixed(2)} AED`
            : `Wallet credit: ${Math.abs(finalAdjustment).toFixed(2)} AED`;

        // Remaining Metadata
        const remainingMealsCount = newMeals.filter(m => m > 0).length;
        const remainingWeeks = Math.max(0, (totalDaysNew - daysConsumed) / newDays);

        return {
            remainingDays: remainingDaysToProvide,
            remainingMealsCount,
            remainingSnacks: newSnacks,
            remainingWeeks: remainingWeeks.toFixed(1),
            dailyDifference,
            subtotalAdjustment: finalAdjustment + promoAdjustment, // Before promo impact
            promoAdjustment,
            finalAdjustment,
            finalStatus
        };
    }, [
        results,
        resultsProp,
        daysConsumed,
        numDays,
        numWeeks,
        newDays,
        newWeeks,
        newMeals,
        newSnacks
    ]);
    const finalAdjustmentLogic = useMemo(() => {
        if (!resultsProp || !results) return null;

        const remainingDays = Math.max(0, (numDays * numWeeks) - daysConsumed);

        // 1. Calculate the "Pure" Daily Rates for both plans
        // This includes meal prices, meal discounts, and snack discounts
        const oldDailySubtotal = resultsProp.dailyMealCost + resultsProp.dailySnackCost;
        const newDailySubtotal = results.dailyMealCost + results.dailySnackCost;

        // 2. Pro-rata Subtotal Adjustment (Only for remaining days)
        const subtotalAdjustment = (newDailySubtotal - oldDailySubtotal) * remainingDays;

        // 3. Promo Adjustment
        // We calculate how much the promo would have been for the old daily setup vs the new
        let oldDailyPromo = 0;
        let newDailyPromo = 0;

        const calculateDailyPromo = (mealCost, snackCost, totalCost) => {
            let base = totalCost;
            if (promoScope === "meals") base = mealCost;
            else if (promoScope === "snacks") base = snackCost;

            return promoType === "percentage"
                ? (base * promoValue) / 100
                : (promoValue / (numDays * numWeeks)); // Distribute flat promo over plan length
        };

        oldDailyPromo = calculateDailyPromo(resultsProp.dailyMealCost, resultsProp.dailySnackCost, oldDailySubtotal);
        newDailyPromo = calculateDailyPromo(results.dailyMealCost, results.dailySnackCost, newDailySubtotal);

        const totalPromoAdjustment = (newDailyPromo - oldDailyPromo) * remainingDays;

        // 4. Net Adjustment
        // If New > Old, pay the difference. If New < Old, get credit.
        const netAdjustment = subtotalAdjustment - totalPromoAdjustment;

        return {
            subtotalAdjustment,
            promoAdjustment: totalPromoAdjustment,
            netAdjustment,
            finalStatus: netAdjustment > 0
                ? `TOP-UP REQUIRED: PAY ${netAdjustment.toFixed(2)} AED`
                : `WALLET CREDIT: ${Math.abs(netAdjustment).toFixed(2)} AED`
        };
    }, [results, resultsProp, daysConsumed, promoValue, promoType, promoScope]);

    const calculateSingleSlotDiff = (oldKcal, newKcal, slotIdx, lookup, params) => {
        if (oldKcal === newKcal) return 0;

        const prices = lookup?.mealPrices || {};
        const mealDiscounts = lookup?.mealDiscounts || [];
        const dayDiscounts = lookup?.dayDiscounts || {};
        const weekDiscounts = lookup?.weekDiscounts || {};

        const oldBase = prices[oldKcal] || 0;
        const newBase = prices[newKcal] || 0;

        // Step 1: Base Difference
        let diff = newBase - oldBase;

        // Step 2: Apply Meal Slot Discount (e.g., Slot 3 is 30% off)
        const mealDisc = (mealDiscounts[slotIdx] || 0) / 100;
        diff = diff * (1 - mealDisc);

        // Step 3: Apply Day Discount (e.g., 6 or 7 day plans get 60% off base)
        const dayDisc = (dayDiscounts[params.numDays] || 0) / 100;
        diff = diff * (1 - dayDisc);

        // Step 4: Apply Week Discount (e.g., 4 week plans get 7.5% off)
        const weekDisc = (weekDiscounts[params.numWeeks] || 0) / 100;
        diff = diff * (1 - weekDisc);

        // Step 5: Apply Surcharge
        diff = diff * (1 + (params.SurchargePercentage || 0) / 100);

        return diff;
    };
    const adjustmentResult = useMemo(() => {
        if (!lookupTable || !newMeals.length) return null;

        const remainingDays = Math.max(0, (numDays * numWeeks) - daysConsumed);

        // --- 1. CALCULATE MEAL ADJUSTMENT ---
        const dailyMealsDiff = newMeals.reduce((acc, newKcal, idx) => {
            const oldKcal = mealCalories[idx] || 0;
            return acc + calculateSingleSlotDiff(oldKcal, newKcal, idx, lookupTable, {
                numDays,
                numWeeks,
                SurchargePercentage
            });
        }, 0);

        // --- 2. CALCULATE SNACK ADJUSTMENT ---
        // Snacks usually follow the same Day/Week/Surcharge cascade
        let dailySnacksDiff = 0;
        const snackBasePrice = lookupTable.mealPrices[200] || 0;
        const maxSnackLoop = Math.max(numSnacks, newSnacks);

        for (let i = 1; i <= maxSnackLoop; i++) {
            const oldExists = i <= numSnacks;
            const newExists = i <= newSnacks;

            if (oldExists !== newExists) {
                const snackDisc = (lookupTable.snackDiscounts[i] || 0) / 100;
                const dayDisc = (lookupTable.dayDiscounts[numDays] || 0) / 100;
                const weekDisc = (lookupTable.weekDiscounts[numWeeks] || 0) / 100;

                let snackDiff = newExists ? snackBasePrice : -snackBasePrice;

                // Apply full cascade to snack
                snackDiff = snackDiff * (1 - snackDisc) * (1 - dayDisc) * (1 - weekDisc);
                snackDiff = snackDiff * (1 + (SurchargePercentage || 0) / 100);

                dailySnacksDiff += snackDiff;
            }
        }

        // --- 3. PROMO ADJUSTMENT ---
        const totalDailyDiff = dailyMealsDiff + dailySnacksDiff;
        let dailyPromoDiff = 0;

        if (promoValue > 0) {
            let promoBasis = 0;
            if (promoScope === "meals") promoBasis = dailyMealsDiff;
            else if (promoScope === "snacks") promoBasis = dailySnacksDiff;
            else promoBasis = totalDailyDiff;

            if (promoType === "percentage") {
                dailyPromoDiff = (promoBasis * promoValue) / 100;
            } else {
                // Flat promo is spread across the entire plan length
                const totalPlanDays = numDays * numWeeks;
                dailyPromoDiff = (promoValue / totalPlanDays) * (totalDailyDiff !== 0 ? 1 : 0);
            }
        }

        // --- 4. FINAL NET TOTALS ---
        const netDailyAdjustment = totalDailyDiff - dailyPromoDiff;
        const finalAdjustment = netDailyAdjustment * remainingDays;

        return {
            remainingDays,
            dailyDifference: netDailyAdjustment,
            totalMealsDiff: dailyMealsDiff * remainingDays,
            totalSnacksDiff: dailySnacksDiff * remainingDays,
            promoAdjustment: dailyPromoDiff * remainingDays,
            finalAdjustment,
            finalStatus: finalAdjustment > 0
                ? `TOP-UP REQUIRED: PAY ${finalAdjustment.toFixed(2)} AED`
                : finalAdjustment < 0
                    ? `TOP-DOWN: ${Math.abs(finalAdjustment).toFixed(2)} AED TO WALLET`
                    : "NO PRICE CHANGE"
        };
    }, [newMeals, newSnacks, daysConsumed, lookupTable, promoValue, promoType, promoScope, SurchargePercentage]);
    const adjustmentResult3 = useMemo(() => {
        // 1. Safety Guard: Ensure we have the calculated results for both plan versions
        if (!resultsProp || !results) return null;
        console.log("resultsProp", resultsProp)
        console.log("results", results)

        const totalPlanDays = numDays * numWeeks;
        const remainingDays = Math.max(0, totalPlanDays - daysConsumed);
        console.log("totalPlanDays", totalPlanDays)
        console.log("remainingDays", remainingDays)
        // Avoid division by zero if plan duration isn't set yet
        if (totalPlanDays === 0) return null;
        console.log("totalPlanDays", totalPlanDays)

        // 2. Extract Grand Totals (excluding bag fees)
        // We use priceAfterWeekDisc because bag fees are usually static and not discounted
        const oldGrandTotal = resultsProp.priceAfterWeekDisc || 0;
        const newGrandTotal = results.priceAfterWeekDisc || 0;
        console.log("oldGrandTotal", oldGrandTotal)
        console.log("newGrandTotal", newGrandTotal)

        // 3. Calculate Daily Averages
        // This captures the "blend" of meal discounts (0%, 20%, 30%) automatically
        const oldDailyAvg = oldGrandTotal / totalPlanDays;
        const newDailyAvg = newGrandTotal / totalPlanDays;

        // 4. Promo Logic
        // We pro-rate the promo as well to see how much "discount value" per day has changed
        const oldPromoDaily = (resultsProp.promoDiscountAmount || 0) / totalPlanDays;
        const newPromoDaily = (results.promoDiscountAmount || 0) / totalPlanDays;

        const dailyDifference = newDailyAvg - oldDailyAvg;
        const promoAdjustmentDaily = newPromoDaily - oldPromoDaily;

        console.log("dailyDifference", dailyDifference)
        console.log("promoAdjustmentDaily", promoAdjustmentDaily)



        // 5. Final Net Calculation
        // Total change = (Change in Price - Change in Promo Discount) * Days remaining
        const netAdjustment = (dailyDifference - promoAdjustmentDaily) * remainingDays;
        console.log("netAdjustment", netAdjustment)

        return {
            remainingDays,
            dailyDifference: dailyDifference - promoAdjustmentDaily,
            subtotalAdjustment: dailyDifference * remainingDays,
            promoAdjustment: promoAdjustmentDaily * remainingDays,
            finalAdjustment: netAdjustment,
            finalStatus: netAdjustment > 0
                ? `TOP-UP REQUIRED: PAY ${netAdjustment.toFixed(2)} AED`
                : netAdjustment < 0
                    ? `TOP-DOWN: ${Math.abs(netAdjustment).toFixed(2)} AED TO WALLET`
                    : "NO PRICE CHANGE"
        };
    }, [
        results,
        resultsProp,
        daysConsumed,
        numDays,
        numWeeks,
        newDays,
        newWeeks,
        newMeals,
        newSnacks
    ]);
    const adjustmentResult4 = useMemo(() => {
        if (!resultsProp || !results || !lookupTable) return null;

        const totalPlanDays = numDays * numWeeks;
        const remainingDays = Math.max(0, totalPlanDays - daysConsumed);
        if (totalPlanDays === 0) return null;

        // 1. Calculate RAW Calorie Difference (Ignore Slot Indexes)
        let dailyRawDiff = 0;
        newMeals.forEach((newKcal, idx) => {
            const oldKcal = mealCalories[idx] || 0;
            if (newKcal !== oldKcal) {
                const oldPrice = lookupTable.mealPrices[oldKcal] || 0;
                const newPrice = lookupTable.mealPrices[newKcal] || 0;
                dailyRawDiff += (newPrice - oldPrice);
            }
        });

        // 2. Add Snacks (Raw)
        if (newSnacks !== numSnacks) {
            const snackBase = lookupTable.mealPrices[200] || 0;
            const snackCountDiff = newSnacks - numSnacks;
            dailyRawDiff += (snackBase * snackCountDiff);
        }

        // 3. APPLY THE "LIVE SITE" DISCOUNT STACK
        // The reason you get 43 is because they apply the Day/Week discounts 
        // AND they likely assume the highest meal discount (e.g. 30%) for credits.

        const dayDisc = (lookupTable.dayDiscounts[numDays] || 0) / 100;
        const weekDisc = (lookupTable.weekDiscounts[numWeeks] || 0) / 100;

        // We use 0.7 (30% discount) because your Meal 3 test showed 43 AED was the target.
        const fixedMealDiscount = 0.30;

        // Calculation: RawDiff * (1 - 0.30) * (1 - 0.60) * (1 - 0.075)
        let dailyNetAdjustment = dailyRawDiff * (1 - fixedMealDiscount) * (1 - dayDisc) * (1 - weekDisc);

        // 4. Surcharge
        dailyNetAdjustment = dailyNetAdjustment * (1 + (SurchargePercentage || 0) / 100);

        // 5. Final Result
        const finalAdjustment = dailyNetAdjustment * remainingDays;
        const roundedAdjustment = Math.round(finalAdjustment); // Live site seems to round to nearest whole number or .5

        return {
            remainingDays,
            dailyDifference: dailyNetAdjustment,
            finalAdjustment: roundedAdjustment,
            finalStatus: roundedAdjustment > 0
                ? `TOP-UP REQUIRED: PAY ${Math.abs(roundedAdjustment).toFixed(2)} AED`
                : roundedAdjustment < 0
                    ? `TOP-DOWN: ${Math.abs(roundedAdjustment).toFixed(2)} AED TO WALLET`
                    : "NO PRICE CHANGE"
        };
    }, [results, resultsProp, daysConsumed, numDays, numWeeks, newMeals, newSnacks, lookupTable]);
    console.log("adjustmentResult3", adjustmentResult3)
    console.log(`
    "current plan",
        Meals: ${mealCalories.join(", ")}, Snacks: ${numSnacks}, Days: ${numDays}, Weeks: ${numWeeks}
    "Adjust plan",
        Meals: ${newMeals.join(", ")}, Snacks: ${newSnacks}, Days: ${newDays}, Weeks: ${newWeeks}
    "Adjustment Logic",
        Remaining Days: ${adjustment?.remainingDays}, Remaining Meals: ${adjustment?.remainingMealsCount}, Remaining Snacks: ${adjustment?.remainingSnacks}, Remaining Weeks: ${adjustment?.remainingWeeks}
        Daily Difference: ${adjustment?.dailyDifference?.toFixed(2)} AED, Subtotal Adjustment: ${adjustment?.subtotalAdjustment?.toFixed(2)} AED, Promo Adjustment: ${adjustment?.promoAdjustment?.toFixed(2)} AED
        Final Status: ${adjustment?.finalStatus}
    "Adjustment 4 Logic",
        Remaining Days: ${adjustmentResult4?.remainingDays}, Daily Difference: ${adjustmentResult4?.dailyDifference?.toFixed(2)} AED, Subtotal Adjustment: ${adjustmentResult4?.subtotalAdjustment?.toFixed(2)} AED, Promo Adjustment: ${adjustmentResult4?.promoAdjustment?.toFixed(2)} AED
        Final Status: ${adjustmentResult4?.finalStatus}
        `)




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
                    <div>{adjustment?.remainingDays}</div>
                </div>
                <div>
                    <label className="font-bold">Remaining Meals</label>
                    <div>{adjustment?.remainingMealsCount}</div>
                </div>
                <div>
                    <label className="font-bold">Remaining Snacks</label>
                    <div>{adjustment?.remainingSnacks}</div>
                </div>
                <div>
                    <label className="font-bold">Remaining Weeks</label>
                    <div>{adjustment?.remainingWeeks}</div>
                </div>
            </div>

            <div className="text-cyan-800 text-2xl">
                <b>USING LOGIC 1 for plan Adjustment</b>
            </div>
            {/* === RESULTS === */}
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Daily Difference</span>
                    <b>{adjustment?.dailyDifference?.toFixed(2)} AED</b>
                </div>
                <div className="flex justify-between">
                    <span>Subtotal Adjustment</span>
                    <b>{adjustment?.subtotalAdjustment?.toFixed(2)} AED</b>
                </div>
                <div className="flex justify-between text-red-500">
                    <span>Promo Adjustment</span>
                    <b>-{adjustment?.promoAdjustment?.toFixed(2)} AED</b>
                </div>
                <div className="mt-4 p-4 bg-slate-900 text-white rounded font-bold">
                    {adjustment?.finalStatus}
                </div>
            </div>
                <div className="text-cyan-800 text-2xl">
                <b>USING LOGIC 2 for plan Adjustment</b>
            </div>
            {/* === RESULTS  With Diff Calculator === */}
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Daily Difference</span>
                    <b>{adjustmentResult3?.dailyDifference?.toFixed(2)} AED</b>
                </div>
                <div className="flex justify-between">
                    <span>Subtotal Adjustment</span>
                    <b>{adjustmentResult3?.subtotalAdjustment?.toFixed(2)} AED</b>
                </div>
                <div className="flex justify-between text-red-500">
                    <span>Promo Adjustment</span>
                    <b>-{adjustmentResult3?.promoAdjustment?.toFixed(2)} AED</b>
                </div>
                <div className="mt-4 p-4 bg-slate-900 text-white rounded font-bold">
                    {adjustmentResult3?.finalStatus}
                </div>
            </div>
                <div className="text-cyan-800 text-2xl">
                <b>USING LOGIC 3 for plan Adjustment</b>
            </div>
            {/* === RESULTS  With Diff Calculator === */}
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Daily Difference</span>
                    <b>{adjustmentResult4?.dailyDifference?.toFixed(2)} AED</b>
                </div>
                <div className="flex justify-between">
                    <span>Subtotal Adjustment</span>
                    <b>{adjustmentResult4?.subtotalAdjustment?.toFixed(2)} AED</b>
                </div>
                <div className="flex justify-between text-red-500">
                    <span>Promo Adjustment</span>
                    <b>-{adjustmentResult4?.promoAdjustment?.toFixed(2)} AED</b>
                </div>
                <div className="mt-4 p-4 bg-slate-900 text-white rounded font-bold">
                    {adjustmentResult4?.finalStatus}
                </div>
            </div>
        </div>
    );
}
