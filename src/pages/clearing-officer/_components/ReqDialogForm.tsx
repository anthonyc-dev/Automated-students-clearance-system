import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface ReqDialogFormProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  newRequirement: {
    title: string;
    department: string;
    description: string;
    dueDate: string;
    requirements: string[];
  };
  setNewRequirement: (requirement: {
    title: string;
    department: string;
    description: string;
    dueDate: string;
    requirements: string[];
  }) => void;
  handleCreateRequirement: () => void;
  categories: string[];
}

const ReqDialogForm = ({
  isDialogOpen,
  setIsDialogOpen,
  newRequirement,
  setNewRequirement,
  handleCreateRequirement,
  categories,
}: ReqDialogFormProps) => {
  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Requirements
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Requirement</DialogTitle>
            <DialogDescription>
              Add a new clearance requirement for students to complete.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter requirement title"
                value={newRequirement.title}
                onChange={(e) =>
                  setNewRequirement({
                    ...newRequirement,
                    title: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Input
                id="requirements"
                placeholder="Enter requirement requirements"
                value={newRequirement.requirements.join(", ")}
                onChange={(e) =>
                  setNewRequirement({
                    ...newRequirement,
                    requirements: e.target.value
                      .split(",")
                      .map((r) => r.trim()),
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={newRequirement.department}
                onValueChange={(value) =>
                  setNewRequirement({
                    ...newRequirement,
                    department: value,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(1).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <div className="grid gap-2">
                <Label htmlFor="event-date">Due Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={newRequirement.dueDate}
                  onChange={(e) =>
                    setNewRequirement({
                      ...newRequirement,
                      dueDate: e.target.value,
                    })
                  }
                  className="w-full"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter requirement description"
                value={newRequirement.description}
                onChange={(e) =>
                  setNewRequirement({
                    ...newRequirement,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleCreateRequirement}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Requirement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReqDialogForm;
