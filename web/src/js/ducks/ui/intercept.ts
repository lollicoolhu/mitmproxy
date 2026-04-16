import { Action, Dispatch } from "redux";
import { fetchApi } from "../../utils";

export interface InterceptRule {
    id: string;
    method: string;
    path: string;
    query: string;
    response_code: number;
    response_headers: [string, string][];
    response_content: string;
    enabled: boolean;
}

export interface InterceptState {
    rules: InterceptRule[];
    activeRule?: InterceptRule;
}

export const RECEIVE_RULES = "INTERCEPT_RECEIVE_RULES";
export const ADD_RULE = "INTERCEPT_ADD_RULE";
export const DELETE_RULE = "INTERCEPT_DELETE_RULE";
export const SET_ACTIVE_RULE = "INTERCEPT_SET_ACTIVE_RULE";

const initialState: InterceptState = {
    rules: [],
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
            };
        case SET_ACTIVE_RULE:
            return {
                ...state,
                activeRule: action.rule,
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
        const savedRule = await response.json();
        dispatch({ type: ADD_RULE, rule: savedRule });
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
