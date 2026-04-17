import * as React from "react";
import { useEffect } from "react";
import classnames from "classnames";
import { useAppDispatch, useAppSelector } from "../ducks";
import { fetchRules, saveRule, selectRules, setActiveRule } from "../ducks/ui/intercept";
import Splitter from "./common/Splitter";
import InterceptDetail from "./InterceptConfig/InterceptDetail";

export default function InterceptConfig() {
    const dispatch = useAppDispatch();
    const rules = useAppSelector((state) => state.ui.intercept.rules);
    const selectedIds = useAppSelector((state) => state.ui.intercept.selectedRuleIds);
    const activeRule = useAppSelector((state) => state.ui.intercept.activeRule);
    
    const selectedRule = rules.find(r => selectedIds.includes(r.id));

    useEffect(() => {
        dispatch(fetchRules());
    }, []);

    // Sync activeRule whenever selection changes
    useEffect(() => {
        if (selectedRule && activeRule?.id !== selectedRule.id) {
            dispatch(setActiveRule(selectedRule));
        } else if (!selectedRule && activeRule) {
            dispatch(setActiveRule(undefined));
        }
    }, [selectedRule?.id, activeRule?.id]);

    const toggleRule = (rule, e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(saveRule({ ...rule, enabled: !rule.enabled }));
    };

    const renderCriteria = (criteria: any) => {
        if (!Array.isArray(criteria)) return "";
        return criteria.map(c => {
            const type = (c.type || 'header').toUpperCase();
            const op = c.operator === 'eq' ? '=' : (c.operator || '=');
            return `${type}:${c.key}${op}${c.value}`;
        }).join(', ');
    };

    return (
        <>
            <div className="flow-table" style={{ flex: "1 1 auto", overflowY: "auto" }}>
                <table style={{ lineHeight: '32px' }}>
                    <thead>
                        <tr>
                            <th className="col-status" style={{ width: '40px' }}>On</th>
                            <th className="col-method">Method</th>
                            <th className="col-path">Path</th>
                            <th className="col-path">Criteria</th>
                            <th className="col-status">Code</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map((rule) => (
                            <tr 
                                key={rule.id} 
                                className={classnames({ selected: selectedIds.includes(rule.id) })}
                                onClick={() => dispatch(selectRules([rule.id]))}
                            >
                                <td className="col-status" onClick={(e) => toggleRule(rule, e)}>
                                    <i className={classnames("fa", rule.enabled ? "fa-check-square-o text-success" : "fa-square-o")} />
                                </td>
                                <td className="col-method">{rule.method}</td>
                                <td className="col-path">{rule.path}</td>
                                <td className="col-path">
                                    {renderCriteria(rule.criteria)}
                                </td>
                                <td className="col-status">{rule.response_code}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedRule && activeRule && (
                <>
                    <Splitter />
                    <InterceptDetail rule={activeRule} />
                </>
            )}
        </>
    );
}
