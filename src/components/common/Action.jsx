import { Button } from "./Button";
import { Pencil, Trash2} from 'lucide-react'

export const Action = ({onEdit, onDelete}) => {

    return (
        <div className="flex justify-center gap-2">
            <Button
                variant="neutral"
                onClick={onEdit}
            >
                <Pencil className="h-4 w-4"/>
            </Button>

            <Button
                variant="neutral"
                onClick={onDelete}
            >
                <Trash2 className="h-4 w-4 text-red-500"/>
            </Button>
        </div>
    );
}