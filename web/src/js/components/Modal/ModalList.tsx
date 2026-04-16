import * as React from "react";
import ModalLayout from "./ModalLayout";
import OptionContent from "./OptionModal";
import InterceptRuleContent from "./InterceptRuleModal";

function OptionModal() {
    return (
        <ModalLayout>
            <OptionContent />
        </ModalLayout>
    );
}

function InterceptRuleModal() {
    return (
        <ModalLayout>
            <InterceptRuleContent />
        </ModalLayout>
    );
}

export default {
    OptionModal,
    InterceptRuleModal,
};
