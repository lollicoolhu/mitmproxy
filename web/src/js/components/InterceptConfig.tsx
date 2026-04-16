import * as React from "react";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../ducks";
import { fetchRules, deleteRule, saveRule, setActiveRule, InterceptRule } from "../ducks/ui/intercept";
import * as modalActions from "../ducks/ui/modal";

export default function InterceptConfig() {
    const dispatch = useAppDispatch();
    const rules = useAppSelector((state) => state.ui.intercept.rules);

    useEffect(() => {
        dispatch(fetchRules());
    }, []);

    const toggleRule = (rule: InterceptRule) => {
        dispatch(saveRule({ ...rule, enabled: !rule.enabled }));
    };

    const editRule = (rule: InterceptRule) => {
        dispatch(setActiveRule(rule));
        dispatch(modalActions.setActiveModal("InterceptRuleModal"));
    };

    return (
        <div className="intercept-config p-3">
            <div className="flex-row">
                <h3>Intercept Rules</h3>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Enabled</th>
                        <th>Method</th>
                        <th>Path</th>
                        <th>Query</th>
                        <th>Response Code</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rules.map((rule) => (
                        <tr key={rule.id}>
                            <td>
                                <input
                                    type="checkbox"
                                    checked={rule.enabled}
                                    onChange={() => toggleRule(rule)}
                                />
                            </td>
                            <td>{rule.method}</td>
                            <td>{rule.path}</td>
                            <td>{rule.query}</td>
                            <td>{rule.response_code}</td>
                            <td>
                                <button
                                    className="btn btn-info btn-sm mr-2"
                                    onClick={() => editRule(rule)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => dispatch(deleteRule(rule.id))}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
