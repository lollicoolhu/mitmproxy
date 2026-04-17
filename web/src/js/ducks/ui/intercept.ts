import type { Dispatch } from "redux";
import { Action } from "redux";
import { fetchApi } from "../../utils";

export interface MatchCriterion {
    type: string; // query, cookie, header, body
    key: string;
    operator: string;
    value: string;
    logic: string;
}

export interface InterceptRule {
    id: string;
    method: string;
    path: string;
    response_code: number;
    response_content: string;
    enabled: boolean;
    criteria: MatchCriterion[];
    response_headers: MatchCriterion[];
    reference_info?: {
        path?: string;
        query?: Record<string, string>;
        headers?: [string, string][];
        cookies?: [string, string][];
        body?: string;
    };
}

export interface InterceptState {
    rules: InterceptRule[];
    activeRule?: InterceptRule;
    selectedRuleIds: string[];
}

export const RECEIVE_RULES = "INTERCEPT_RECEIVE_RULES";
export const ADD_RULE = "INTERCEPT_ADD_RULE";
export const DELETE_RULE = "INTERCEPT_DELETE_RULE";
export const SET_ACTIVE_RULE = "INTERCEPT_SET_ACTIVE_RULE";
export const UPDATE_ACTIVE_RULE = "INTERCEPT_UPDATE_ACTIVE_RULE";
export const SELECT_RULE = "INTERCEPT_SELECT_RULE";

const initialState: InterceptState = {
    rules: [],
    selectedRuleIds: [],
};

export default function reducer(state = initialState, action): InterceptState {
    switch (action.type) {
        case RECEIVE_RULES:
            return {
                ...state,
                rules: action.rules,
            };
        case ADD_RULE:
            return {
                ...state,
                rules: [...state.rules.filter(r => r.id !== action.rule.id), action.rule],
            };
        case DELETE_RULE:
            return {
                ...state,
                rules: state.rules.filter((r) => r.id !== action.id),
                selectedRuleIds: state.selectedRuleIds.filter(id => id !== action.id),
            };
        case SET_ACTIVE_RULE:
            return {
                ...state,
                activeRule: action.rule,
            }
        case UPDATE_ACTIVE_RULE:
            return {
                ...state,
                activeRule: state.activeRule ? { ...state.activeRule, ...action.rule } : undefined,
            }
        case SELECT_RULE:
            return {
                ...state,
                selectedRuleIds: action.ids,
            }
        default:
            return state;
    }
}

export function fetchRules() {
    return async (dispatch: Dispatch) => {
        const response = await fetchApi("/intercept/rules");
        const rules = await response.json();
        dispatch({ type: RECEIVE_RULES, rules });
    };
}

export function saveRule(rule: InterceptRule) {
    return async (dispatch: Dispatch) => {
        const response = await fetchApi("/intercept/rules", {
            method: "POST",
            body: JSON.stringify(rule),
            headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
            const savedRule = await response.json();
            dispatch({ type: ADD_RULE, rule: savedRule });
        } else {
            const err = await response.text();
            console.error("Error saving rule:", err);
            alert("Error saving rule: " + err);
        }
    };
}

export function deleteRule(id: string) {
    return async (dispatch: Dispatch) => {
        await fetchApi(`/intercept/rules/${id}`, { method: "DELETE" });
        dispatch({ type: DELETE_RULE, id });
    };
}

export function setActiveRule(rule?: InterceptRule) {
    return { type: SET_ACTIVE_RULE, rule };
}

export function updateActiveRule(rule: Partial<InterceptRule>) {
    return { type: UPDATE_ACTIVE_RULE, rule };
}

export function selectRules(ids: string[]) {
    return { type: SELECT_RULE, ids };
}

export async function checkDuplicate(rule: InterceptRule): Promise<InterceptRule | null> {
    const response = await fetchApi("/intercept/rules/check-duplicate", {
        method: "POST",
        body: JSON.stringify(rule),
        headers: { "Content-Type": "application/json" },
    });
    if (response.status === 200) {
        return await response.json();
    }
    return null;
}
