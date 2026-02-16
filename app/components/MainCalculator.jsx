"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { LOOKUP_TABLE } from '../constants';
import PlanAdjustmentCalculator from './PlanAdjustmentCalculator';

export default function MealPlanCalculator() {
    const [mealCalories, setMealCalories] = useState([800, 800, 0, 0, 0]);
    const [numSnacks, setNumSnacks] = useState(1);
    const [numDays, setNumDays] = useState(5);
    const [numWeeks, setNumWeeks] = useState(4);
    const [SurchargePercentage, setSurchargePercentage] = useState(0);
    const [reductionPer, setreductionPer] = useState(12.5);
    const [markupPer, setmarkupPer] = useState(25);
    const [promoType, setPromoType] = useState("percentage"); // "flat" | "percentage"
    const [promoValue, setPromoValue] = useState(0);
    const [promoScope, setPromoScope] = useState("both");     // "meals", "snacks", "both"
    const [oldPricing, setoldPricing] = useState('1');     // "meals", "snacks", "both"
    const [snackOldPricing, setsnackOldPricing] = useState('1');     // "meals", "snacks", "both"

    const [lookupTable, setLookupTable] = useState({
        mealPrices: {
            200: 12.0,
            400: 49.0,
            500: 53.0,
            600: 56.0,
            700: 60.0,
            800: 63.0,
        },
        mealDiscounts: [0, 20, 30, 60, 60],
        dayDiscounts: { 5: 0, 6: 60, 7: 60 },
        weekDiscounts: { 1: 0, 2: 0, 4: 7.5 },
        snackDiscounts: { 1: 20, 2: 30, 3: 40, 4: 40, 5: 40 },
        bagFee: 0.6,
    });

    // State for LocalStorage persistence
    const [savedPlans, setSavedPlans] = useState([]);
    const [planLabel, setPlanLabel] = useState("");

    // Load from localStorage on mount
    useEffect(() => {
        if (oldPricing == '0') {
            setLookupTable({
                mealPrices: {
                    200: 10.0,
                    400: 42.0,
                    500: 45.0,
                    600: 48.0,
                    700: 51.0,
                    800: 54.0,
                },
                mealDiscounts: [0, 7, 22, 27, 32],
                dayDiscounts: { 5: 0, 6: 0, 7: 0 },
                weekDiscounts: { 1: 0, 2: 0, 4: 0 },
                snackDiscounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                // snackDiscounts: { 1: 20, 2: 30, 3: 40, 4: 40, 5: 40 },
                bagFee: 0,
            })
        } else {
            setLookupTable({
                mealPrices: {
                    200: 12.0,
                    400: 49.0,
                    500: 53.0,
                    600: 56.0,
                    700: 60.0,
                    800: 63.0,
                },
                mealDiscounts: [0, 20, 30, 60, 60],
                dayDiscounts: { 5: 0, 6: 60, 7: 60 },
                weekDiscounts: { 1: 0, 2: 0, 4: 7.5 },
                snackDiscounts: { 1: 20, 2: 30, 3: 40, 4: 40, 5: 40 },
                bagFee: 0.6,
            })
        }
    }, [oldPricing]);

    useEffect(() => {
        if (snackOldPricing == '0') {
            setLookupTable({
                ...lookupTable,
                snackDiscounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            })
        } else {
            setLookupTable({
                ...lookupTable,
                snackDiscounts: { 1: 20, 2: 30, 3: 40, 4: 40, 5: 40 },
            })
        }
    }, [snackOldPricing]);

    useEffect(() => {
        const saved = localStorage.getItem('meal_plan_history');
        if (saved) setSavedPlans(JSON.parse(saved));
    }, []);
    useEffect(() => {
        localStorage.setItem('lookup_table', JSON.stringify(lookupTable));
    }, [lookupTable]);

    // const results = useMemo(() => {
    //     const mealCosts = mealCalories.map((kcal, index) => {
    //         if (kcal === 0) return 0;
    //         const basePrice = lookupTable.mealPrices[kcal] || 0;
    //         const discount = lookupTable.mealDiscounts[index] / 100;
    //         return basePrice * (1 - discount);
    //     });
    //     const baseMealCosts = mealCalories.map((kcal, index) => {
    //         if (kcal === 0) return 0;
    //         const basePrice = lookupTable.mealPrices[kcal] || 0;
    //         return basePrice;
    //     });
    //     const dailyMealCost = mealCosts.reduce((a, b) => a + b, 0);
    //     const dailyBaseMealCost = baseMealCosts.reduce((a, b) => a + b, 0);

    //     const dailySnackCostFunc = () => {
    //         if (numSnacks === 0) return 0;

    //         let total = 0;
    //         const snackBase = lookupTable.mealPrices[200];

    //         for (let i = 1; i <= numSnacks; i++) {
    //             const discountPercent = lookupTable.snackDiscounts[i] || 0;
    //             const discountedPrice = snackBase * (1 - discountPercent / 100);
    //             total += discountedPrice;
    //         }

    //         return total;
    //     }
    //     const dailySnackBaseCostFunc = () => {
    //         if (numSnacks === 0) return 0;

    //         let total = 0;
    //         const snackBase = lookupTable.mealPrices[200];

    //         for (let i = 1; i <= numSnacks; i++) {
    //             const discountedPrice = snackBase;
    //             total += discountedPrice;
    //         }

    //         return total;
    //     }
    //     const dailySnackCost = dailySnackCostFunc()
    //     const dailyBaseSnackCost = dailySnackBaseCostFunc()
    //     const totalDaily = dailyMealCost + dailySnackCost;
    //     const totalBaseDaily = dailyBaseMealCost + dailyBaseSnackCost;

    //     // day discount logic unchanged...

    //     const subtotalPlan = totalDaily * numDays * numWeeks;
    //     const subtotalBasePlan = totalBaseDaily * numDays * numWeeks;
    //     let dayDiscAmount = 0;
    //     if (numDays >= 6) {
    //         // VLOOKUP values from H2:I4
    //         const rate6 = (lookupTable.dayDiscounts[6] || 0) / 100;
    //         const rate7 = (lookupTable.dayDiscounts[7] || 0) / 100;

    //         const component6 = totalDaily * rate6; // 123 * 0.6 = 73.80
    //         const component7 = totalDaily * rate7; // 123 * 0.6 = 73.80

    //         if (numDays === 6) {
    //             // (C15 * rate6) * numWeeks
    //             dayDiscAmount = component6 * numWeeks;
    //         } else if (numDays === 7) {
    //             // The formula: (comp6 * (C8=6)) + (comp6 * (C8=7)) + (comp7 * (C8=7))
    //             // For C8=7, it becomes: (0) + (comp6) + (comp7)
    //             // Result: (73.80 + 73.80) * 4 weeks = 147.60 * 4 = 590.40
    //             dayDiscAmount = (component6 + component7) * numWeeks;
    //         }
    //     }
    //     const priceAfterDayDiscOnly = subtotalPlan - dayDiscAmount;
    //     const priceAfterDayDiscNSurcharge = priceAfterDayDiscOnly * (1 + SurchargePercentage / 100);
    //     const SurchargeAmount = priceAfterDayDiscOnly - priceAfterDayDiscNSurcharge;
    //     const priceAfterDayDisc = priceAfterDayDiscNSurcharge;
    //     const weekDiscPercent = lookupTable.weekDiscounts[numWeeks] / 100;
    //     const weekDiscAmount = priceAfterDayDisc * weekDiscPercent;

    //     const priceAfterWeekDisc = priceAfterDayDisc - weekDiscAmount;

    //     const totalBagFee = (numDays * numWeeks) * lookupTable.bagFee;
    //     // let subtotalWithDiscountLogic = (subtotalBasePlan - totalBagFee);
    //     let subtotalWithDiscountLogic = (priceAfterDayDiscOnly);
    //     const reductionCoeff = 1 - (reductionPer / 100);
    //     const markupCoeff = 1 - (markupPer / 100);
    //     const anchoredBase = ((subtotalWithDiscountLogic * reductionCoeff) + totalBagFee) / markupCoeff;
    //     const savings = anchoredBase - priceAfterWeekDisc - totalBagFee;


    //     // console.log("bag", subtotalWithDiscountLogic)
    //     // subtotalWithDiscountLogic = subtotalWithDiscountLogic * (1 - 12.5 / 100);
    //     // console.log("12.5", subtotalWithDiscountLogic)
    //     // subtotalWithDiscountLogic += totalBagFee;
    //     // console.log("bag", subtotalWithDiscountLogic)
    //     // subtotalWithDiscountLogic = subtotalWithDiscountLogic * (1 + 33.33 / 100);
    //     // console.log("33.33", subtotalWithDiscountLogic)

    //     // ====== PROMO DISCOUNT CALCULATION ======

    //     let promoDiscountAmount = 0;

    //     // Base amounts
    //     const mealsTotal = dailyMealCost * numDays * numWeeks;
    //     const snacksTotal = dailySnackCost * numDays * numWeeks;
    //     const subtotalBeforePromo = priceAfterWeekDisc;
    //     let grandTotal = priceAfterWeekDisc;

    //     // compute promo discount
    //     if (promoValue > 0) {
    //         if (promoScope === "meals") {
    //             if (promoType === "percentage") {
    //                 promoDiscountAmount = (mealsTotal * promoValue) / 100;
    //             } else {
    //                 promoDiscountAmount = promoValue;
    //             }
    //         } else if (promoScope === "snacks") {
    //             if (promoType === "percentage") {
    //                 promoDiscountAmount = (snacksTotal * promoValue) / 100;
    //             } else {
    //                 promoDiscountAmount = promoValue;
    //             }
    //         } else {
    //             // promo applies to total
    //             if (promoType === "percentage") {
    //                 promoDiscountAmount = (subtotalBeforePromo * promoValue) / 100;
    //             } else {
    //                 promoDiscountAmount = promoValue;
    //             }
    //         }
    //     }

    //     // new grand total
    //     grandTotal = (priceAfterWeekDisc - promoDiscountAmount) + totalBagFee;

    //     return {
    //         mealCosts,
    //         dailyMealCost,
    //         dailySnackCost,
    //         totalDaily,
    //         subtotalPlan,
    //         dayDiscAmount,
    //         SurchargeAmount: SurchargeAmount,
    //         priceAfterDayDisc: priceAfterDayDiscOnly,
    //         SurchargePercentage: priceAfterDayDiscNSurcharge,
    //         weekDiscAmount,
    //         totalBagFee,
    //         promoDiscountAmount,
    //         grandTotal,
    //         subtotalWithDiscountLogic,
    //         subtotalBasePlan,
    //         dailyBaseMealCost,
    //         dailyBaseSnackCost,
    //         totalBaseDaily,
    //         savings,
    //         anchoredBase
    //     };
    // }, [
    //     mealCalories,
    //     numSnacks,
    //     numDays,
    //     numWeeks,
    //     promoType,
    //     promoValue,
    //     promoScope,
    //     lookupTable,
    //     SurchargePercentage,
    //     reductionPer,
    //     markupPer
    // ]);

    /**
 * Calculates meal plan costs and discounts.
 * Handles null/undefined inputs by defaulting to 0 or empty structures.
 */
    /**
     * Calculates meal plan costs with full null-safety for all lookup tables and inputs.
     */
    const calculateMealPlan = (params = {}) => {
        // 1. Destructure with strict defaults to handle null/undefined inputs
        const {
            mealCalories = [],
            numSnacks = 0,
            numDays = 0,
            numWeeks = 0,
            promoType = "percentage",
            promoValue = 0,
            promoScope = "total",
            lookupTable = {},
            SurchargePercentage = 0,
            reductionPer = 0,
            markupPer = 0
        } = params;

        // 2. Safe access to nested lookupTable properties
        const prices = lookupTable?.mealPrices || {};
        const mealDiscounts = lookupTable?.mealDiscounts || {};
        const snackDiscounts = lookupTable?.snackDiscounts || {};
        const dayDiscounts = lookupTable?.dayDiscounts || {};
        const weekDiscounts = lookupTable?.weekDiscounts || {};
        const bagFeePerDay = lookupTable?.bagFee || 0;

        // 3. MEAL CALCULATIONS
        const mealCosts = (mealCalories || []).map((kcal, index) => {
            if (!kcal || kcal === 0) return 0;
            const basePrice = prices[kcal] || 0;
            const discount = (mealDiscounts[index] || 0) / 100;
            return basePrice * (1 - discount);
        });

        const baseMealCosts = (mealCalories || []).map((kcal) => {
            if (!kcal || kcal === 0) return 0;
            return prices[kcal] || 0;
        });

        const dailyMealCost = mealCosts.reduce((a, b) => a + b, 0);
        const dailyBaseMealCost = baseMealCosts.reduce((a, b) => a + b, 0);

        // 4. SNACK CALCULATIONS (Consolidated for cleaner logic)
        const getSnackTotal = (isBase = false) => {
            if (!numSnacks || numSnacks <= 0) return 0;
            let total = 0;
            const snackBase = prices[200] || 0;
            for (let i = 1; i <= numSnacks; i++) {
                const discountPercent = isBase ? 0 : (snackDiscounts[i] || 0);
                total += snackBase * (1 - discountPercent / 100);
            }
            return total;
        };

        const dailySnackCost = getSnackTotal(false);
        const dailyBaseSnackCost = getSnackTotal(true);

        // 5. TOTALS & SUBTOTALS
        const totalDaily = dailyMealCost + dailySnackCost;
        const totalBaseDaily = dailyBaseMealCost + dailyBaseSnackCost;
        const subtotalPlan = totalDaily * numDays * numWeeks;
        const subtotalBasePlan = totalBaseDaily * numDays * numWeeks;

        // 6. DAY DISCOUNT LOGIC
        let dayDiscAmount = 0;
        if (numDays >= 6) {
            const rate6 = (dayDiscounts[6] || 0) / 100;
            const rate7 = (dayDiscounts[7] || 0) / 100;
            const component6 = totalDaily * rate6;
            const component7 = totalDaily * rate7;

            if (numDays === 6) {
                dayDiscAmount = component6 * numWeeks;
            } else if (numDays === 7) {
                dayDiscAmount = (component6 + component7) * numWeeks;
            }
        }

        // 7. SURCHARGES & WEEK DISCOUNTS
        const priceAfterDayDiscOnly = subtotalPlan - dayDiscAmount;
        const priceAfterDayDiscNSurcharge = priceAfterDayDiscOnly * (1 + SurchargePercentage / 100);

        // Correcting the SurchargeAmount logic to ensure it reflects the added cost
        const SurchargeAmount = priceAfterDayDiscNSurcharge - priceAfterDayDiscOnly;

        const weekDiscPercent = (weekDiscounts[numWeeks] || 0) / 100;
        const weekDiscAmount = priceAfterDayDiscNSurcharge * weekDiscPercent;
        const priceAfterWeekDisc = priceAfterDayDiscNSurcharge - weekDiscAmount;

        // 8. FEES & ANCHORED BASE (MARKUP/REDUCTION)
        const totalBagFee = (numDays * numWeeks) * bagFeePerDay;
        const subtotalWithDiscountLogic = priceAfterDayDiscOnly;
        const reductionCoeff = 1 - (reductionPer / 100);
        const markupCoeff = 1 - (markupPer / 100);

        // Safety check for division by zero
        const anchoredBase = markupCoeff !== 0
            ? ((subtotalWithDiscountLogic * reductionCoeff) + totalBagFee) / markupCoeff
            : 0;

        const savings = anchoredBase - priceAfterWeekDisc - totalBagFee;

        // 9. PROMO DISCOUNT CALCULATION
        let promoDiscountAmount = 0;
        const mealsTotal = dailyMealCost * numDays * numWeeks;
        const snacksTotal = dailySnackCost * numDays * numWeeks;

        if (promoValue > 0) {
            if (promoScope === "meals") {
                promoDiscountAmount = (promoType === "percentage") ? (mealsTotal * promoValue) / 100 : promoValue;
            } else if (promoScope === "snacks") {
                promoDiscountAmount = (promoType === "percentage") ? (snacksTotal * promoValue) / 100 : promoValue;
            } else {
                promoDiscountAmount = (promoType === "percentage") ? (priceAfterWeekDisc * promoValue) / 100 : promoValue;
            }
        }

        const grandTotal = (priceAfterWeekDisc - promoDiscountAmount) + totalBagFee;

        // 10. RETURN ALL VALUES
        return {
            mealCosts,
            dailyMealCost,
            dailySnackCost,
            totalDaily,
            subtotalPlan,
            dayDiscAmount,
            SurchargeAmount,
            priceAfterDayDisc: priceAfterDayDiscOnly, // As per your naming
            priceAfterWeekDisc: priceAfterWeekDisc, // As per your naming
            SurchargePercentage: priceAfterDayDiscNSurcharge, // As per your naming (Total including surcharge)
            weekDiscAmount,
            totalBagFee,
            promoDiscountAmount,
            grandTotal,
            subtotalWithDiscountLogic,
            subtotalBasePlan,
            dailyBaseMealCost,
            dailyBaseSnackCost,
            totalBaseDaily,
            savings,
            anchoredBase
        };
    };
    const results = useMemo(() => calculateMealPlan({
    mealCalories,
    numSnacks,
    numDays,
    numWeeks,
    promoType,
    promoValue,
    promoScope,
    lookupTable,
    SurchargePercentage,
    reductionPer,
    markupPer
}), [mealCalories, numSnacks, numDays, numWeeks, promoType, promoValue, promoScope, lookupTable, SurchargePercentage, reductionPer, markupPer]);
    const removePlan = (id) => {
        const updated = savedPlans.filter(p => p.id !== id);
        setSavedPlans(updated);
        localStorage.setItem('meal_plan_history', JSON.stringify(updated));
    };

    // Save full plan to history
    const saveToHistory = () => {
        const newEntry = {
            id: Date.now(),
            label: planLabel || `Plan ${savedPlans.length + 1}`,
            data: {
                mealCalories,
                numSnacks,
                numDays,
                numWeeks,
                promoType,
                promoValue,
                promoScope,
                lookupTable,
                total: results?.grandTotal.toFixed(2),
            },
            date: new Date(),
            pricing: oldPricing
        };

        const updated = [newEntry, ...savedPlans];
        setSavedPlans(updated);
        localStorage.setItem('meal_plan_history', JSON.stringify(updated));
        setPlanLabel("");
    };

    // Load full plan from history
    const setToPlan = (id) => {
        const foundPlan = savedPlans.find(p => p.id === id);
        if (foundPlan) {
            const data = foundPlan.data;
            setMealCalories(data.mealCalories || [800, 800, 0, 0, 0]);
            setNumSnacks(data.numSnacks || 1);
            setNumDays(data.numDays || 5);
            setNumWeeks(data.numWeeks || 4);
            setPromoType(data.promoType || "percentage");
            setPromoValue(data.promoValue || 0);
            setPromoScope(data.promoScope || "both");
            setLookupTable(data.lookupTable || lookupTable);
            setoldPricing(data.pricing || '1')
        }
    };



    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans text-slate-900">
            <div className="max-w-8xl mx-auto gap-8 grid grid-cols-1 md:grid-cols-2 ">
                {/* LEFT SIDE: INPUTS */}
                <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="col-span-1 bg-white p-6 rounded shadow border-t-4 border-orange-400">
                        <h3 className="font-bold mb-4">Pricing Configuration</h3>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <label className="text-sm">Pricing Schene:</label>
                                <select
                                    className="border p-2 rounded bg-green-50"
                                    value={oldPricing}
                                    onChange={(e) => {
                                        setoldPricing(e.target.value)
                                    }}
                                >
                                    <option value={'1'}>New Pricing</option>
                                    <option value={'0'}>Old Pricing</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm">Snack pricing:</label>
                                <select
                                    className="border p-2 rounded bg-green-50"
                                    value={snackOldPricing}
                                    onChange={(e) => {
                                        setsnackOldPricing(e.target.value)
                                    }}
                                >
                                    <option value={'0'}>Old Pricing</option>
                                    <option value={'1'}>New Pricing</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-3 text-sm text-gray-600 mt-6  ">Meal and Snacks discounts (AED)</h4>
                            <div className='grid grid-cols-2'>
                                <div>
                                    {lookupTable?.mealDiscounts?.map((disc, index) => (
                                        <div key={index} className="flex flex-col">
                                            <label className="text-xs font-bold text-gray-400">
                                                Meal {index + 1} ({disc} %)
                                            </label>
                                        </div>
                                    ))}

                                </div>
                                <div>
                                    {Object.entries(lookupTable?.snackDiscounts)?.map((disc, index) => (
                                        <div key={index} className="flex flex-col">
                                            <label className="text-xs font-bold text-gray-400">
                                                Snack {index + 1} ({disc?.slice(1)} %)
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <h4 className="font-bold mb-3 text-sm text-gray-600 mt-6">Pricing w.r.t to calories(AED)</h4>
                            {Object.entries(lookupTable.mealPrices).map(([kcal, price]) => (
                                <div key={kcal} className="flex justify-between items-center">
                                    <span>{kcal} kcal</span>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) =>
                                            setLookupTable(prev => ({
                                                ...prev,
                                                mealPrices: {
                                                    ...prev.mealPrices,
                                                    [kcal]: Number(e.target.value),
                                                },
                                            }))
                                        }
                                        className="border p-1 rounded w-24"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="mt-6">
                            <label className="block text-sm font-bold">4-Week Discount (%)</label>
                            <input
                                type="number"
                                value={lookupTable.weekDiscounts[4]}
                                onChange={(e) =>
                                    setLookupTable(prev => ({
                                        ...prev,
                                        weekDiscounts: {
                                            ...prev.weekDiscounts,
                                            4: Number(e.target.value),
                                        },
                                    }))
                                }
                                className="border p-2 rounded w-32"
                            />
                        </div>
                        <div className="mt-6 border-t pt-4">
                            <h4 className="font-bold mb-3 text-sm text-gray-600">
                                Day Discounts (%)
                            </h4>

                            <div className="grid grid-cols-3 gap-4">
                                {[5, 6, 7].map(day => (
                                    <div key={day} className="flex flex-col">
                                        <label className="text-xs font-bold text-gray-400">
                                            {day} Days
                                        </label>

                                        <input
                                            type="number"
                                            value={lookupTable.dayDiscounts[day]}
                                            disabled={day === 5}
                                            onChange={(e) =>
                                                setLookupTable(prev => ({
                                                    ...prev,
                                                    dayDiscounts: {
                                                        ...prev.dayDiscounts,
                                                        [day]: Number(e.target.value),
                                                    },
                                                }))
                                            }
                                            className={`border p-2 rounded ${day === 5 ? 'bg-gray-100 cursor-not-allowed' : 'bg-green-50'
                                                }`}
                                        />

                                        {day === 5 && (
                                            <span className="text-[10px] text-gray-400 mt-1">
                                                No discount for 5 days
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Applied per day & multiplied by number of weeks
                            </p>
                        </div>


                    </div>
                    <div className="col-span-1 bg-white p-6 rounded shadow-sm border-t-4 border-green-500">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">Plan Configuration</h2>
                        <div className="space-y-4">
                            {mealCalories.map((kcal, i) => (
                                <div key={i} className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-100">
                                    <label className="text-sm font-semibold">Meal {i + 1} Calories</label>
                                    <select
                                        value={kcal}
                                        onChange={(e) => {
                                            const newCals = [...mealCalories];
                                            newCals[i] = parseInt(e.target.value);
                                            setMealCalories(newCals);
                                        }}
                                        className="bg-white border rounded p-1 text-sm w-32"
                                    >
                                        <option value={0}>0 (None)</option>
                                        {[400, 500, 600, 700, 800].map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                            ))}
                            <div className="grid grid-cols-1 gap-4 mt-4">
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-gray-400">SNACKS</label>
                                    <select
                                        value={numSnacks}
                                        onChange={(e) => setNumSnacks(Number(e.target.value))}
                                        className="border p-2 bg-green-50 rounded w-full">
                                        {[0, 1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-gray-400">DAYS</label>
                                    <select value={numDays} onChange={(e) => setNumDays(Number(e.target.value))} className="border p-2 rounded bg-green-50">
                                        {[5, 6, 7].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-gray-400">WEEKS</label>
                                    <select value={numWeeks} onChange={(e) => setNumWeeks(Number(e.target.value))} className="border p-2 rounded bg-green-50">
                                        {[1, 2, 4].map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-gray-400">Sur charge Percentage (%)</label>
                                    <input
                                        type="number"
                                        value={SurchargePercentage}
                                        onChange={(e) =>
                                            setSurchargePercentage(e.target.value)
                                        }
                                        className="border p-2 rounded w-32"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-gray-400">Markup Percentage (%)</label>
                                    <input
                                        type="number"
                                        value={reductionPer}
                                        onChange={(e) =>
                                            setreductionPer(e.target.value)
                                        }
                                        className="border p-2 rounded w-32"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-gray-400">Markup Coefficient (%)</label>
                                    <input
                                        type="number"
                                        value={markupPer}
                                        onChange={(e) =>
                                            setmarkupPer(e.target.value)
                                        }
                                        className="border p-2 rounded w-32"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="col-span-1 bg-white p-6 rounded shadow-sm border-t-4 border-green-500">
                        <h2 className="text-xl font-bold mb-6">Plan Pricing Breakdown</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm border-b pb-2">
                                <span>Daily Meal Cost</span>
                                <span className="font-mono font-bold">AED {results?.dailyMealCost.toFixed(2)}</span>
                            </div>
                            {/* <div className="flex text-gray-400 justify-between text-sm border-b pb-2">
                                <span>Daily Base Meal Cost</span>
                                <span className="font-mono font-bold">AED {results?.dailyBaseMealCost.toFixed(2)}</span>
                            </div> */}
                            <div className="flex justify-between text-sm border-b pb-2">
                                <span>Total Snack Cost</span>
                                <span className="font-mono font-bold">AED {results?.dailySnackCost.toFixed(2)}</span>
                            </div>
                            {/* <div className="flex text-gray-400 justify-between text-sm border-b pb-2">
                                <span>Total Base Snack Cost</span>
                                <span className="font-mono font-bold">AED {results?.dailyBaseSnackCost.toFixed(2)}</span>
                            </div> */}
                            <div className="flex justify-between text-sm border-b pb-2">
                                <span>Total Daily</span>
                                <span className="font-mono font-bold">AED {results?.totalDaily.toFixed(2)}</span>
                            </div>
                            {/* <div className="flex text-gray-400 justify-between text-sm border-b pb-2">
                                <span>Total Base Daily</span>
                                <span className="font-mono font-bold">AED {results?.totalBaseDaily.toFixed(2)}</span>
                            </div> */}
                            <div className="flex justify-between text-sm border-b pb-2">
                                <span>Total Sub Total</span>
                                <span className="font-mono font-bold">AED {results?.subtotalPlan.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 text-sm border-b pb-2">
                                <span>Total Sub Total Base</span>
                                <span className="font-mono font-bold">AED {results?.anchoredBase.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm border-b pb-2 text-amber-600">
                                <span>You saved</span>
                                <span className="font-mono font-bold">AED {results?.savings.toFixed(2)}</span>
                            </div>
                            {/* <div className="flex justify-between text-sm border-b pb-2">
                                <span>Total with disocunt and Markup 12.5% and 25%</span>
                                <span className="font-mono font-bold">AED {results?.subtotalWithDiscountLogic.toFixed(2)}</span>
                            </div> */}
                            <div className="flex justify-between text-sm text-red-500 italic">
                                <span>Day Discount (Formula Logic)</span>
                                <span>- AED {results?.dayDiscAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-500 italic">
                                <span>Total price: After Day Disc (Formula Logic)</span>
                                <span>- AED {results?.priceAfterDayDisc.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-500 italic">
                                <span>Surcharge Amount (Formula Logic)</span>
                                <span>- AED {results?.SurchargeAmount?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-500 italic">
                                <span>Total price: After Surcharge (Formula Logic)</span>
                                <span>- AED {results?.SurchargePercentage?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-500 italic">
                                <span>Week Discount ({results?.weekDiscPercent}%)</span>
                                <span>- AED {results?.weekDiscAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-blue-500">
                                <span>Bag Fee (Total)</span>
                                <span>+ AED {results?.totalBagFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-500 italic">
                                <span>Promo Discount</span>
                                <span>- AED {results?.promoDiscountAmount.toFixed(2)}</span>
                            </div>
                            <div className="mt-8 p-6 bg-slate-900 text-white rounded-xl shadow-lg">
                                <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Final Grand Total</span>
                                <span className="text-4xl font-black text-green-400">AED {results?.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div className='col-span-1 md:col-span-3 bg-white p-4 rounded shadow border-t-4 border-purple-500 grid grid-cols-2'>
                        <div className=" ">
                            <h3 className="font-bold text-lg text-purple-600 mb-4">Promo Discount</h3>
                            <div className="flex items-center gap-2 flex-wrap">

                                <div className="flex items-center gap-2">
                                    <label className="text-sm">Type:</label>
                                    <select
                                        className="border p-2 rounded bg-green-50"
                                        value={promoType}
                                        onChange={(e) => setPromoType(e.target.value)}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat Amount</option>
                                    </select>
                                </div>
                                <div className="">
                                    <label className="text-sm">Apply On:</label>
                                    <select
                                        className="border p-2 rounded bg-green-50"
                                        value={promoScope}
                                        onChange={(e) => setPromoScope(e.target.value)}
                                    >
                                        <option value="both">Everything</option>
                                        <option value="meals">Meals Only</option>
                                        <option value="snacks">Snacks Only</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-3">
                                <label className="text-sm">Value:</label>
                                <input
                                    type="number"
                                    className="border p-2 rounded bg-green-50"
                                    value={promoValue}
                                    onChange={(e) => setPromoValue(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                {/* RIGHT SIDE: RESULTS */}
                <div className="col-span-2 md:col-span-1 bg-white p-6 rounded shadow-sm border-t-4 border-slate-400 ">
                    <div className="col-span-2 my-3 pt-2 bg-white p-6 rounded shadow-sm ">
                        <h2 className="text-xl font-bold mb-6">Save your plan</h2>
                        <input
                            type="text"
                            placeholder="Plan Name"
                            value={planLabel}
                            onChange={(e) => setPlanLabel(e.target.value)}
                            className="flex-1 border p-2 rounded text-sm"
                        />
                        <button
                            onClick={saveToHistory}
                            className="mt-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700"
                        >
                            Save Calculation
                        </button>
                    </div>
                    {/* STORAGE SECTION */}
                    {savedPlans.length > 0 && (
                        <div className="bg-white p-6 rounded shadow-sm border-t-4 border-blue-400 mt-8 ">
                            <h3 className="font-bold text-gray-500 mb-4 uppercase text-xs">Saved Snapshots Click to restore</h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {savedPlans.map((plan) => (
                                    <div key={plan.id}
                                        onClick={() => { setToPlan(plan.id) }}
                                        className="flex justify-between items-center p-3 bg-gray-50 rounded border text-sm cursor-pointer flex-wrap">
                                        <div>
                                            <span className="font-bold block">{plan.label}</span>
                                            <span className="text-xs text-gray-400">
                                                Saved on {new Intl.DateTimeFormat('en-PK', {
                                                    timeZone: 'Asia/Karachi',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: true,
                                                }).format(new Date(plan?.date))}
                                            </span>
                                            <br />
                                            <span className="text-xs text-gray-400">{plan.data.numDays} Days x {plan.data.numWeeks} Weeks</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-mono font-bold text-blue-600">AED {plan.data.total}</span>
                                            <button onClick={() => removePlan(plan.id)} className="text-red-400 hover:text-red-600 font-bold">✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
                <PlanAdjustmentCalculator
                    mealCalories={mealCalories}
                    numSnacks={numSnacks}
                    numDays={numDays}
                    numWeeks={numWeeks}
                    SurchargePercentage={SurchargePercentage}
                    reductionPer={reductionPer}
                    markupPer={markupPer}
                    promoType={promoType}
                    promoValue={promoValue}
                    promoScope={promoScope}
                    oldPricing={oldPricing}
                    snackOldPricing={snackOldPricing}
                    results={results}
                    lookupTable={lookupTable}
                    calculateMealPlan={calculateMealPlan}
                />
            </div>
        </div>
    );
}