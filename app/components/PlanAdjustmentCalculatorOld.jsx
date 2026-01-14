"use client";
import React, { useMemo, useState, useEffect } from "react";

export default function PlanAdjustmentCalculator({
  mealCalories,
  numSnacks,
  numDays,
  numWeeks,
  lookupTable,
  promoType,
  promoValue,
  promoScope,
}) {
  // === STATE ===
  const [daysConsumed, setDaysConsumed] = useState(0);
  const [newMeals, setNewMeals] = useState([...mealCalories]);
  const [newSnacks, setNewSnacks] = useState(numSnacks);
  const [newDays, setNewDays] = useState(numDays);
  const [newWeeks, setNewWeeks] = useState(numWeeks);

  // Initialize newMeals with old + 0s to make 5
  useEffect(() => {
    const mealsArr = [...mealCalories];
    while (mealsArr.length < 5) mealsArr.push(0);
    setNewMeals(mealsArr);
  }, [mealCalories]);

  const handleMealChange = (idx, kcal) => {
    const updated = [...newMeals];
    updated[idx] = kcal;
    setNewMeals(updated);
  };

  // === CALCULATION HELPERS ===
  const calcDailyMealCost = (mealsArr) => {
    return mealsArr.reduce((sum, kcal, idx) => {
      if (!kcal) return sum;
      const base = lookupTable.mealPrices[kcal] || 0;
      const disc = lookupTable.mealDiscounts[idx] || 0;
      return sum + base * (1 - disc / 100);
    }, 0);
  };

  const calcDailySnackCost = (snackCount) => {
    const base = lookupTable.mealPrices[200];
    let total = 0;
    for (let i = 1; i <= snackCount; i++) {
      const disc = lookupTable.snackDiscounts[i] || 0;
      total += base * (1 - disc / 100);
    }
    return total;
  };

  const adjustment = useMemo(() => {
    const totalPlanDaysOld = numDays * numWeeks;
    const totalPlanDaysNew = newDays * newWeeks;
    const remainingDays = Math.max(totalPlanDaysOld - daysConsumed, 0);

    // Old daily costs
    const oldDailyMeals = calcDailyMealCost(mealCalories);
    const oldDailySnacks = calcDailySnackCost(numSnacks);
    const oldDailyTotal = oldDailyMeals + oldDailySnacks;

    // New daily costs
    const newDailyMeals = calcDailyMealCost(newMeals);
    const newDailySnacks = calcDailySnackCost(newSnacks);
    const newDailyTotal = newDailyMeals + newDailySnacks;

    // Difference per day
    const dailyDifference = newDailyTotal - oldDailyTotal;

    // Subtotal adjustment (remaining days)
    const subtotalAdjustment = dailyDifference * remainingDays;

    // PROMO ADJUSTMENT
    let promoAdjustment = 0;
    if (promoValue > 0 && subtotalAdjustment !== 0) {
      let base = Math.abs(subtotalAdjustment);
      // determine if promo applies
      if (promoScope === "meals") base = Math.abs(newDailyMeals - oldDailyMeals) * remainingDays;
      else if (promoScope === "snacks") base = Math.abs(newDailySnacks - oldDailySnacks) * remainingDays;
      promoAdjustment = promoType === "percentage" ? (base * promoValue) / 100 : Math.min(promoValue, base);
    }

    // Net adjustment
    const netAdjustment =
      subtotalAdjustment > 0
        ? subtotalAdjustment - promoAdjustment
        : subtotalAdjustment + promoAdjustment;

    // Final status
    const finalStatus =
      netAdjustment > 0
        ? `TOP-UP REQUIRED: PAY ${netAdjustment.toFixed(2)} AED`
        : netAdjustment < 0
        ? `TOP-DOWN: ${Math.abs(netAdjustment).toFixed(2)} AED WILL BE CREDITED`
        : "NO PRICE CHANGE";

    return {
      remainingDays,
      dailyDifference,
      subtotalAdjustment,
      promoAdjustment,
      netAdjustment,
      finalStatus,
    };
  }, [
    newMeals,
    mealCalories,
    numSnacks,
    newSnacks,
    numDays,
    newDays,
    numWeeks,
    newWeeks,
    daysConsumed,
    promoType,
    promoValue,
    promoScope,
    lookupTable,
  ]);

  
  return (
    <div className="bg-white p-6 rounded shadow border-t-4 border-indigo-600 mt-8">
      <h2 className="font-bold text-lg mb-4">Plan Adjustment (Old vs New Plan)</h2>

      {/* === OLD PLAN DISPLAY === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <label className="font-bold">Old Meals</label>
          <div>{mealCalories.join(", ")} kcal</div>
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
            onChange={(e) => setNewSnacks(Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </div>
        <div>
          <label className="font-bold">New Days</label>
          <input
            type="number"
            value={newDays}
            onChange={(e) => setNewDays(Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </div>
        <div>
          <label className="font-bold">New Weeks</label>
          <input
            type="number"
            value={newWeeks}
            onChange={(e) => setNewWeeks(Number(e.target.value))}
            className="border p-2 rounded w-full"
          />
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

      {/* === RESULTS === */}
      {adjustment && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Remaining Days</span>
            <b>{adjustment.remainingDays}</b>
          </div>
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
      )}
    </div>
  );
}
