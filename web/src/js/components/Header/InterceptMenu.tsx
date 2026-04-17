import * as React from "react"
import { useRef } from "react"
import { useAppDispatch, useAppSelector } from "../../ducks"
import { fetchRules, setActiveRule, deleteRule } from "../../ducks/ui/intercept"
import * as modalActions from "../../ducks/ui/modal"
import { fetchApi } from "../../utils"
import Button from "../common/Button"

export default function InterceptMenu() {
    const dispatch = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const selectedIds = useAppSelector(state => state.ui.intercept.selectedRuleIds);
    const rules = useAppSelector(state => state.ui.intercept.rules);
    const activeRule = useAppSelector(state => state.ui.intercept.activeRule);
    
    const selectedRule = rules.find(r => selectedIds.includes(r.id));

    const onExport = () => {
        window.open("./intercept/rules/export");
    };

    const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const response = await fetchApi("/intercept/rules/import", {
                method: "POST",
                body: file,
            });
            if (response.ok) {
                dispatch(fetchRules());
            }
        } catch (err) {
            console.error(err);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const onSave = () => {
        if (!activeRule) return;
        dispatch(saveRule(activeRule));
    };

    const onDelete = () => {
        if (!selectedRule) return;
        if (confirm("Are you sure you want to delete this rule?")) {
            dispatch(deleteRule(selectedRule.id));
        }
    };

    return (
        <div className="menu-menu">
            <div className="menu-group">
                <div className="menu-content">
                    <Button
                        title="Save changes to rule"
                        icon="fa-save text-primary"
                        onClick={onSave}
                        disabled={!selectedRule}
                    >
                        Save
                    </Button>
                    <Button
                        title="Delete selected rule"
                        icon="fa-trash text-danger"
                        onClick={onDelete}
                        disabled={!selectedRule}
                    >
                        Delete
                    </Button>
                </div>
                <div className="menu-legend">Actions</div>
            </div>

            <div className="menu-group">
                <div className="menu-content">
                    <Button
                        title="Export rules to JSON"
                        icon="fa-download text-primary"
                        onClick={onExport}
                    >
                        Export
                    </Button>
                    <Button
                        title="Import rules from JSON"
                        icon="fa-upload text-success"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Import
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        accept=".json"
                        onChange={onImport}
                    />
                </div>
                <div className="menu-legend">File</div>
            </div>
        </div>
    )
}

InterceptMenu.title = "Intercept"
